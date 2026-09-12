// Opt-in integration: temporary branch only; never updates the default branch.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { GitHub } from "../skills/memo/scripts/spec/github.mjs";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";

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
  const store = new SpecStore({ env: { ...process.env, GEI_SPEC_HOME: path.join(root, "knowledge"), GEI_SPEC_STATE: path.join(root, "state") }, github: api });
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
  await store.edit({ base_revision: updated.revision, summary: "Remove integration fixture", edits: [{ op: "delete", path: name }] });
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
