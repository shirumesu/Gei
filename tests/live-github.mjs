// Opt-in integration: temporary branch only; never updates the default branch.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const plugin = process.env.GEI_TEST_PLUGIN || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { GitHub } = await import(pathToFileURL(path.join(plugin, "skills/memo/scripts/spec/github.mjs")));
const { SpecStore } = await import(pathToFileURL(path.join(plugin, "skills/memo/scripts/spec/store.mjs")));

const repo = process.env.GEI_TEST_REPO;
if (!repo) throw new Error("Set GEI_TEST_REPO=owner/private-repository to opt into temporary-branch integration testing.");
const api = new GitHub();
const info = await api.info(repo);
assert.equal(info.private, true, "Live tests require a private repository");
const initial = await api.head({ repo, branch: info.default_branch });
const branch = `kona/spec-test-${randomUUID()}`;
const root = fs.mkdtempSync(path.join(os.tmpdir(), "gei-spec-live-"));
let created = false;
try {
  await api.request(`/repos/${repo}/git/refs`, { method: "POST", body: { ref: `refs/heads/${branch}`, sha: initial } });
  created = true;
  const env = { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") };
  const store = new SpecStore({ env, github: api });
  await store.connect({ repo, branch, apply: true });
  const name = `projects/spec-test-${randomUUID()}/INDEX.md`;
  const read = await store.read({ paths: [name] });
  assert.equal(read.files[0].exists, false);
  const saved = await store.edit({ base_revision: read.revision, summary: "Verify Spec integration", edits: [{ op: "create", path: name, content: "# Spec integration fixture\nOriginal.\n" }] });
  assert.equal(saved.applied, true);
  const updated = await store.edit({ base_revision: saved.revision, summary: "Verify exact replacement", edits: [{ op: "replace", path: name, old_text: "Original.", new_text: "Verified. 中文。" }] });
  const content = await store.read({ paths: [name], revision: updated.revision });
  assert.match(content.files[0].content, /Verified\. 中文。/);
  await assert.rejects(store.edit({ base_revision: saved.revision, summary: "Reject stale edit", edits: [{ op: "delete", path: name }] }), { code: "REVISION_CONFLICT" });

  const other = new SpecStore({ env: { ...process.env, GEI_SPEC_HOME: path.join(root, "other-knowledge"), GEI_SPEC_STATE: path.join(root, "other-state") }, github: api });
  await other.connect({ repo, branch, apply: true });
  const otherRead = await other.read({ paths: [name] });
  const raced = await Promise.allSettled([
    store.edit({ base_revision: updated.revision, summary: "First writer", edits: [{ op: "replace", path: name, old_text: "Verified.", new_text: "First." }] }),
    other.edit({ base_revision: otherRead.revision, summary: "Second writer", edits: [{ op: "replace", path: name, old_text: "Verified.", new_text: "Second." }] }),
  ]);
  assert.equal(raced.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(raced.find(result => result.status === "rejected").reason.code, "REVISION_CONFLICT");
  await store.refresh();
  const winner = await store.read({ paths: [name] });
  assert.match(winner.files[0].content, /First\.|Second\./);
  assert.match((await store.read({ paths: [name], revision: updated.revision })).files[0].content, /Verified\./);
  console.log("PASS independent-device race: one commit, one conflict, old snapshot preserved.");

  const absent = name.replace("INDEX.md", "invalid-batch.md");
  const beforeInvalid = await api.head({ repo, branch });
  await assert.rejects(store.edit({ base_revision: winner.revision, summary: "Reject invalid batch", edits: [
    { op: "create", path: absent, content: "Must not persist" },
    { op: "replace", path: name, old_text: "Missing exact match", new_text: "No" },
  ] }), { code: "NO_MATCH" });
  assert.equal(await api.head({ repo, branch }), beforeInvalid);
  assert.equal((await store.read({ paths: [absent] })).files[0].exists, false);

  let dropped = false;
  const responseLoss = new GitHub({ fetcher: async (url, options) => {
    const response = await fetch(url, options);
    if (url.endsWith("/graphql") && response.ok && !dropped) {
      const body = await response.clone().json();
      if (body.data?.createCommitOnBranch?.commit) { dropped = true; throw new Error("Simulated lost response after real commit"); }
    }
    return response;
  } });
  const uncertain = new SpecStore({ env, github: responseLoss });
  const verified = await uncertain.edit({ base_revision: winner.revision, summary: "Verify lost response recovery", edits: [
    { op: "replace", path: name, old_text: "中文。", new_text: "Response verified. 中文。" },
  ] });
  assert.equal(dropped, true);
  assert.equal(verified.verified_after_retry, true);
  console.log("PASS invalid batch leaves remote unchanged; real commit with lost response is verified.");

  await store.refresh();
  const config = JSON.parse(fs.readFileSync(store.configFile, "utf8"));
  fs.writeFileSync(store.configFile, JSON.stringify({ ...config, cacheSeconds: 0 }));
  const offline = new SpecStore({ env, github: new GitHub({ fetcher: async () => { throw new Error("Simulated offline transport"); } }) });
  const cached = await offline.read({ paths: [name] });
  assert.equal(cached.stale, true);
  assert.equal(cached.source, "cache");
  await assert.rejects(offline.edit({ base_revision: cached.revision, summary: "Reject offline write", edits: [{ op: "delete", path: name }] }), { code: "NETWORK" });
  assert.equal(fs.existsSync(path.join(env.GEI_SPEC_HOME, name)), false);
  await assert.rejects(offline.useLocal({ apply: true }), { code: "NETWORK" });
  assert.equal((await offline.status()).mode, "github");
  await offline.setEnabled(false);
  await assert.rejects(offline.read({ paths: [name] }), { code: "DISABLED" });
  await assert.rejects(offline.search({ query: "fixture" }), { code: "DISABLED" });
  await assert.rejects(offline.edit({ base_revision: cached.revision, summary: "Disabled", edits: [{ op: "delete", path: name }] }), { code: "DISABLED" });
  const exported = await offline.useLocal({ cached_revision: cached.revision, apply: true });
  assert.equal((await offline.status()).enabled, false);
  assert.ok(fs.existsSync(exported.backup));
  await offline.setEnabled(true);
  assert.equal((await offline.read({ paths: [name] })).files[0].content, cached.files[0].content);
  await assert.rejects(offline.edit({ base_revision: cached.revision, summary: "Old binding", edits: [{ op: "delete", path: name }] }), { code: "REVISION" });
  console.log("PASS offline cache, no write fallback, disable/enable, explicit export, and old-binding rejection.");

  await other.refresh();
  const cleanup = await other.read({ paths: [name] });
  await other.edit({ base_revision: cleanup.revision, summary: "Remove integration fixture", edits: [{ op: "delete", path: name }] });
  assert.equal(await api.head({ repo, branch: info.default_branch }), initial, "Default branch must remain unchanged");
  console.log("PASS live GitHub: binding, create, exact edit, immutable read, stale revision rejection, delete; default branch unchanged.");
} finally {
  if (created) {
    await api.request(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "DELETE" });
    console.log("Temporary remote test branch removed.");
  }
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("gei-spec-live-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
