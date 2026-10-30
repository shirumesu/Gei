import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { locations, readJson, writeJson, locked, recover, publish, scan, revisionOf, documentPath, isDocument, safeFile, validateNames, fail, hash } from "./io.mjs";
import { GitHub } from "./github.mjs";
import { editHelp, rangeReplacements } from "./editing.mjs";
import { windowBytes, sharedBudgets, readWindow } from "./retrieval.mjs";

const DEFAULTS = { enabled: true, mode: "local", generation: "initial", cacheSeconds: 60 };
const own = (object, key) => Object.hasOwn(object, key);
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(name => a[name] !== b[name]);
// Git checkouts may convert LF to CRLF; only migration treats those bytes as equivalent.
const sameImportContent = (a, b) => typeof b === "string" && a.replaceAll("\r\n", "\n") === b.replaceAll("\r\n", "\n");
export class SpecStore {
  constructor({ env = process.env, github, ...options } = {}) {
    Object.assign(this, locations(env));
    this.github = github || new GitHub({ env, ...options });
    this.configFile = path.join(this.state, "config.json");
  }
  config() {
    const config = { ...DEFAULTS, ...readJson(this.configFile, {}) };
    if (!["local", "github"].includes(config.mode)) fail("CONFIG", "Unknown Spec storage mode.");
    return config;
  }
  async run(action, { enabled = true, lockTimeout = 15000 } = {}) {
    return locked(this.state, async () => {
      recover(this.home, this.state);
      const config = this.config();
      if (enabled && !config.enabled) fail("DISABLED", "Spec is disabled. Enable it through the settings CLI.");
      return action(config);
    }, lockTimeout);
  }
  target(config) { return `${config.generation}:${config.mode}:${config.mode === "github" ? hash(JSON.stringify(config.github)).slice(0, 12) : "local"}`; }
  version(config, oid) {
    const target = this.target(config);
    const reference = `r_${hash(`markdown:${target}:${oid}`).slice(0, 16)}`;
    const file = path.join(this.state, "revisions", `${reference}.json`);
    const existing = readJson(file);
    if (existing && (existing.target !== target || existing.oid !== oid)) fail("REVISION", "Revision reference collision; read again after repairing the local reference cache.");
    if (!existing) writeJson(file, { target, oid, coordinates: "markdown" });
    return reference;
  }
  oid(config, revision) {
    if (typeof revision !== "string" || !/^r_[a-f0-9]{16}$/u.test(revision)) fail("REVISION", "Read from the current storage binding before editing.");
    const resolved = readJson(path.join(this.state, "revisions", `${revision}.json`));
    if (!resolved || resolved.coordinates !== "markdown" || resolved.target !== this.target(config) || !/^[a-f0-9]{40,64}$/u.test(resolved.oid)) fail("REVISION", "This revision is unavailable, uses an older document view, or belongs to another binding. Read the documents again.");
    return resolved.oid;
  }
  snapshotFile(config, oid) { return path.join(this.state, "snapshots", hash(this.target(config)), `${oid}.json`); }
  // Format 4 trees include the root AGENTS.md; older cached trees omit it.
  saveSnapshot(config, snapshot) { snapshot.storageFormat = 4; writeJson(this.snapshotFile(config, snapshot.oid), snapshot); return snapshot; }
  cachedSnapshot(config, oid) { const value = readJson(this.snapshotFile(config, oid)); return value?.storageFormat === 4 ? value : null; }
  headFile(config) { return path.join(this.state, "heads", hash(this.target(config)) + ".json"); }
  connection(config, ok, error) {
    writeJson(path.join(this.state, "connection.json"), { target: this.target(config), at: new Date().toISOString(), ok, error });
  }
  async latest(config, { refresh = false, timeout } = {}) {
    if (config.mode === "local") {
      const files = scan(this.home);
      return this.saveSnapshot(config, { oid: revisionOf(files), files, at: new Date().toISOString(), source: "local" });
    }
    const cached = readJson(this.headFile(config));
    const cachedState = cached && this.cachedSnapshot(config, cached.oid);
    if (!refresh && cachedState && Date.now() - Date.parse(cached.checkedAt) < config.cacheSeconds * 1000) {
      return { ...cachedState, source: "cache", stale: false, checkedAt: cached.checkedAt };
    }
    try {
      const oid = await this.github.head(config.github, { timeout });
      let snapshot = this.cachedSnapshot(config, oid);
      if (!snapshot) {
        const tree = await this.github.tree(config.github, oid, { timeout });
        for (const item of tree) {
          documentPath(item.path);
          if (item.type !== "blob" || item.mode !== "100644") fail("INVALID_PATH", "Remote knowledge must be regular files.", { path: item.path });
        }
        validateNames(tree.map(item => item.path));
        snapshot = this.saveSnapshot(config, { oid, tree, files: {}, at: new Date().toISOString() });
      }
      const checkedAt = new Date().toISOString();
      writeJson(this.headFile(config), { oid, checkedAt });
      this.connection(config, true);
      return { ...snapshot, source: "github", stale: false, checkedAt };
    } catch (error) {
      this.connection(config, false, { code: error.code, message: error.message });
      if (refresh || !cachedState) throw error;
      return { ...cachedState, source: "cache", stale: true, checkedAt: cached.checkedAt };
    }
  }
  async snapshot(config, revision, options) {
    if (!revision) return this.latest(config, options);
    const oid = this.oid(config, revision);
    const snapshot = this.cachedSnapshot(config, oid);
    if (snapshot) return { ...snapshot, source: config.mode === "local" ? "local" : "cache", stale: false };
    if (config.mode === "local") fail("REVISION", "This local snapshot is unavailable. Read the current version.");
    const tree = await this.github.tree(config.github, oid, options);
    for (const item of tree) { documentPath(item.path); if (item.type !== "blob" || item.mode !== "100644") fail("INVALID_PATH", "Remote knowledge must be regular files."); }
    validateNames(tree.map(item => item.path));
    return this.saveSnapshot(config, { oid, tree, files: {}, source: "github", at: new Date().toISOString() });
  }
  async hydrate(config, snapshot, names, options = {}) {
    const missing = names.filter(name => !own(snapshot.files, name));
    if (config.mode === "github") {
      // Fetch a bounded batch, while preserving one immutable commit for every file.
      for (let i = 0; i < missing.length; i += 6) {
        await Promise.all(missing.slice(i, i + 6).map(async name => {
          const item = snapshot.tree.find(entry => entry.path === name);
          if (item) {
            try { snapshot.files[name] = await this.github.content(config.github, item.sha, options); }
            catch (error) { if (options.allowUnavailable) return; throw error; }
          }
        }));
      }
      this.saveSnapshot(config, snapshot);
    }
    return snapshot;
  }
  names(snapshot) { return snapshot.tree ? snapshot.tree.map(item => item.path).sort() : Object.keys(snapshot.files).sort(); }
  async status() {
    return this.run(config => ({ enabled: config.enabled, mode: config.mode, localDirectory: this.home,
      settingsFile: this.configFile, repository: config.github?.repo, branch: config.github?.branch,
      cacheSeconds: config.cacheSeconds, cache: readJson(this.headFile(config)),
      connection: readJson(path.join(this.state, "connection.json")) }), { enabled: false });
  }
  async setEnabled(enabled) {
    return this.run(config => { writeJson(this.configFile, { ...config, enabled }); return { enabled, mode: config.mode }; }, { enabled: false });
  }
  async read({ paths, revision, start_line, start_column = 1, max_lines = 200, line_numbers = false } = {}) {
    if (!Array.isArray(paths) || !paths.length || paths.length > 20) fail("ARGUMENT", "Read between 1 and 20 paths in one call.");
    paths.forEach(documentPath);
    if (typeof line_numbers !== "boolean") fail("ARGUMENT", "line_numbers must be a boolean.");
    if ((start_line !== undefined && (!Number.isInteger(start_line) || start_line < 1)) || !Number.isInteger(start_column) || start_column < 1 || !Number.isInteger(max_lines) || max_lines < 1 || max_lines > 1000) fail("ARGUMENT", "Use start_line/start_column >= 1 and max_lines between 1 and 1000.");
    if (start_line === undefined && start_column !== 1) fail("ARGUMENT", "start_column requires start_line.");
    return this.run(async config => {
      const snapshot = await this.snapshot(config, revision);
      await this.hydrate(config, snapshot, paths);
      const pinned = this.version(config, snapshot.oid);
      const starts = paths.map(() => start_line ?? 1);
      const needs = paths.map((name, index) => {
        const text = snapshot.files[name];
        if (text === undefined) return 0;
        const first = text.split("\n")[starts[index] - 1];
        if (first !== undefined && start_column - 1 > Array.from(first).length) fail("ARGUMENT", "start_column is beyond the selected line.", { path: name });
        return windowBytes(text, starts[index], start_column, max_lines, line_numbers);
      });
      const budgets = sharedBudgets(needs);
      return { revision: pinned, source: snapshot.source, stale: Boolean(snapshot.stale), checked_at: snapshot.checkedAt,
        files: paths.map((name, index) => {
          const text = snapshot.files[name];
          if (text === undefined) return { path: name, exists: false };
          const window = readWindow(text, { start_line: starts[index], start_column, max_lines, line_numbers }, budgets[index]);
          const next_read = window.truncated ? { paths: [name], revision: pinned, start_line: window.next_line,
            start_column: window.next_column, max_lines, line_numbers } : undefined;
          return { path: name, exists: true, next_read, ...window };
        }) };
    });
  }
  async search({ query = "", path_prefix = "", revision, max_results = 30, offset = 0 } = {}) {
    if (typeof query !== "string" || typeof path_prefix !== "string" || path_prefix.includes("..") || path_prefix.includes("\\")) fail("ARGUMENT", "Use a literal query and a knowledge path prefix such as projects/example/ or context/.");
    if (!Number.isInteger(max_results) || max_results < 1 || max_results > 100) fail("ARGUMENT", "max_results must be between 1 and 100.");
    if (!Number.isInteger(offset) || offset < 0 || (offset && !revision)) fail("ARGUMENT", "Use offset >= 0 and supply revision when continuing a search.");
    return this.run(async config => {
      const snapshot = await this.snapshot(config, revision);
      const pinned = this.version(config, snapshot.oid);
      const names = this.names(snapshot).filter(name => isDocument(name) && name.startsWith(path_prefix));
      const results = [];
      const order = query ? "path-line" : "path";
      if (!query) {
        for (const name of names.slice(offset, offset + max_results + 1)) results.push({ path: name });
      } else {
        let seen = 0;
        for (const name of names) {
          await this.hydrate(config, snapshot, [name]);
          const text = snapshot.files[name];
          for (const [index, line] of text.split("\n").entries()) {
            const match = line.toLowerCase().indexOf(query.toLowerCase());
            if (match < 0 || seen++ < offset) continue;
            const chars = Array.from(line);
            const column = Array.from(line.slice(0, match)).length;
            const start = Math.max(0, column - 100);
            const end = Math.min(chars.length, Math.max(column + Array.from(query).length, start + 400));
            results.push({ path: name, line: index + 1, text: chars.slice(start, Math.min(end, start + 800)).join(""),
              match_column: column + 1, snippet_start_column: start + 1, snippet_truncated: start > 0 || end < chars.length || end > start + 800 });
            if (results.length > max_results) break;
          }
          if (results.length > max_results) break;
        }
      }
      const truncated = results.length > max_results;
      const next_offset = truncated ? offset + max_results : undefined;
      return { revision: pinned, source: snapshot.source, stale: Boolean(snapshot.stale), order, offset,
        next_offset, next_search: truncated ? { query, path_prefix, revision: pinned, max_results, offset: next_offset } : undefined,
        results: results.slice(0, max_results), truncated };
    });
  }
  async edit({ base_revision, summary, edits = [] } = {}) {
    if (typeof summary !== "string" || !summary.trim() || summary.length > 200 || /[\r\n]/u.test(summary)) fail("ARGUMENT", "Provide a concise, single-line summary (1–200 characters).");
    if (!Array.isArray(edits) || !edits.length || edits.length > 100) fail("ARGUMENT", "Provide between 1 and 100 edits.");
    const ops = ["replace", "replace_lines", "create", "delete", "rename"];
    for (const edit of edits) {
      documentPath(edit.path); if (edit.op === "rename") documentPath(edit.to);
      if (!ops.includes(edit.op)) fail("ARGUMENT", `Edit op must be one of ${ops.join(", ")}.`);
    }
    return this.run(async config => {
      const expected = this.oid(config, base_revision);
      const current = await this.latest(config, { refresh: true });
      if (current.oid !== expected) {
        const base = this.cachedSnapshot(config, expected);
        const versions = snapshot => snapshot.tree ? Object.fromEntries(snapshot.tree.map(item => [item.path, item.sha])) : snapshot.files;
        fail("REVISION_CONFLICT", "Knowledge changed. Read the changed documents and reconcile before retrying. Nothing was applied.",
          { applied: false, current_revision: this.version(config, current.oid), changed_paths: base ? changed(versions(base), versions(current)) : undefined });
      }
      await this.hydrate(config, current, [...new Set(edits.flatMap(edit => edit.to ? [edit.path, edit.to] : [edit.path]))]);
      const revision = this.version(config, current.oid);
      const ranges = rangeReplacements(current.files, edits, revision);
      const result = { ...current.files };
      for (const [index, edit] of edits.entries()) {
        const exists = own(result, edit.path);
        const error = (code, message, extra = {}) => fail(code, message, { applied: false, edit_index: index, path: edit.path, ...extra });
        if (edit.op === "replace_lines") {
          result[edit.path] = ranges.get(edit.path);
        } else if (edit.op === "create") {
          if (exists) error("EXISTS", "The document already exists; read and edit it instead of creating.");
          if (typeof edit.content !== "string") error("ARGUMENT", "create requires content.");
          result[edit.path] = edit.content;
        } else {
          if (!exists) error("NOT_FOUND", "Read or create this document before editing it.");
          if (edit.op === "delete") delete result[edit.path];
          else if (edit.op === "rename") {
            if (own(result, edit.to)) error("EXISTS", "The rename destination already exists.");
            result[edit.to] = result[edit.path]; delete result[edit.path];
          } else {
            if (typeof edit.old_text !== "string" || !edit.old_text || typeof edit.new_text !== "string") error("ARGUMENT", "replace requires nonempty old_text and a string new_text.");
            const text = result[edit.path], found = [];
            for (let at = text.indexOf(edit.old_text); at >= 0; at = text.indexOf(edit.old_text, at + 1)) found.push(at);
            if (found.length !== 1) error(found.length ? "AMBIGUOUS_MATCH" : "NO_MATCH", "old_text must match exactly once in the document. Use the base context below, or reread with line numbers and use replace_lines.", { matches: found.length, ...editHelp(current.files[edit.path], edit, revision) });
            result[edit.path] = text.slice(0, found[0]) + edit.new_text + text.slice(found[0] + edit.old_text.length);
          }
        }
      }
      return this.commitChanges(config, current, result, summary);
    });
  }
  async commitChanges(config, current, result, summary) {
    for (const [name, content] of Object.entries(result)) if (Buffer.byteLength(content) > 1024 * 1024) fail("TOO_LARGE", "Knowledge documents must be at most 1 MiB.", { path: name, applied: false });
    const changes = Object.fromEntries(changed(current.files, result).map(name => [name, result[name] ?? null]));
    const finalNames = new Set(this.names(current));
    for (const [name, content] of Object.entries(changes)) { if (content === null) finalNames.delete(name); else finalNames.add(name); }
    validateNames([...finalNames]);
    if (!Object.keys(changes).length) return { applied: false, unchanged: true, revision: this.version(config, current.oid), paths: [] };
    if (config.mode === "local") {
      publish(this.home, this.state, changes);
      const next = await this.latest(config);
      return { applied: true, source: "local", revision: this.version(config, next.oid), paths: Object.keys(changes) };
    }
    let commit;
    try { commit = await this.github.commit(config.github, current.oid, changes, summary); }
    catch (error) {
      // A lost response may follow a successful commit. Never blindly resubmit it.
      try {
        const actual = await this.latest(config, { refresh: true });
        await this.hydrate(config, actual, Object.keys(changes));
        if (Object.entries(changes).every(([name, content]) => content === null ? !this.names(actual).includes(name) : actual.files[name] === content)) {
          return { applied: true, verified_after_retry: true, source: "github", revision: this.version(config, actual.oid), paths: Object.keys(changes) };
        }
        if (actual.oid !== current.oid) fail("REVISION_CONFLICT", "The branch changed during submission. Read the latest documents before retrying.", { applied: false, current_revision: this.version(config, actual.oid) });
      } catch (probe) { if (probe.code === "REVISION_CONFLICT") throw probe; }
      fail("SUBMISSION_UNCONFIRMED", "GitHub submission was not confirmed. Read the latest documents before retrying; no local fallback write was made.", { cause: error.code });
    }
    let next;
    try { next = await this.snapshot(config, this.version(config, commit.oid)); }
    catch { return { applied: true, source: "github", revision: this.version(config, commit.oid), paths: Object.keys(changes), url: commit.url, cache_updated: false }; }
    next.files = result;
    this.saveSnapshot(config, next);
    writeJson(this.headFile(config), { oid: commit.oid, checkedAt: new Date().toISOString() });
    return { applied: true, source: "github", revision: this.version(config, commit.oid), paths: Object.keys(changes), url: commit.url };
  }
  async refresh() {
    return this.run(async config => { const snapshot = await this.latest(config, { refresh: true });
      await this.hydrate(config, snapshot, this.names(snapshot));
      return { revision: this.version(config, snapshot.oid), files: this.names(snapshot).filter(isDocument).length, source: config.mode }; });
  }
  async connect({ repo, branch, create = false, apply = false } = {}) {
    return this.run(async config => {
      if (config.mode === "github") fail("CONFIG", "Switch to local mode before binding another repository.");
      let info;
      try { info = await this.github.info(repo); }
      catch (error) {
        if (error.details?.status !== 404 || !create) throw error;
        if (!apply) return { preview: true, action: "create-private-repository", repo, upload_paths: Object.keys(scan(this.home)) };
        info = await this.github.create(repo);
      }
      if (!info.private) fail("CONFIG", "Use a private repository for Spec.");
      // Integration tokens need not expose user-level push permissions.
      // Actual reads, imports, and later edits are authorized by GitHub's endpoints.
      const next = { ...config, mode: "github", generation: randomUUID(), github: { repo: info.full_name, branch: branch || info.default_branch } };
      const remote = await this.latest(next, { refresh: true });
      await this.hydrate(next, remote, this.names(remote));
      const local = scan(this.home);
      const conflicts = Object.keys(local).filter(name => own(remote.files, name) && !sameImportContent(local[name], remote.files[name]));
      if (conflicts.length) fail("MIGRATION_CONFLICT", "Local and remote documents differ. Reconcile them before connecting; the active mode was not changed.", { paths: conflicts });
      const additions = Object.fromEntries(Object.entries(local).filter(([name]) => !own(remote.files, name)));
      validateNames([...this.names(remote), ...Object.keys(additions)]);
      if (!apply) return { preview: true, repo: next.github.repo, branch: next.github.branch, upload_paths: Object.keys(additions), remote_files: this.names(remote).length };
      if (Object.keys(additions).length) await this.github.commit(next.github, remote.oid, additions, "Import local project knowledge");
      const verified = await this.latest(next, { refresh: true });
      await this.hydrate(next, verified, this.names(verified));
      if (!Object.entries(local).every(([name, content]) => sameImportContent(content, verified.files[name]))) fail("MIGRATION_CONFLICT", "Remote verification changed during import; active mode remains local.");
      writeJson(this.configFile, next);
      return { mode: "github", repo: next.github.repo, branch: next.github.branch, revision: this.version(next, verified.oid) };
    }, { enabled: false });
  }
  async useLocal({ apply = false, cached_revision } = {}) {
    return this.run(async config => {
      if (config.mode === "local") return { mode: "local", unchanged: true };
      const remote = cached_revision ? this.cachedSnapshot(config, this.oid(config, cached_revision)) : await this.latest(config, { refresh: true });
      if (!remote) fail("CACHE_MISS", "The selected cache is unavailable.");
      const names = this.names(remote);
      if (cached_revision && names.some(name => !own(remote.files, name))) fail("CACHE_MISS", "This snapshot is incomplete; reconnect and refresh before switching.");
      await this.hydrate(config, remote, names);
      const local = scan(this.home);
      if (!apply) return { preview: true, action: "use-local", from_revision: this.version(config, remote.oid), cached: Boolean(cached_revision), files: names.length, replaced_paths: changed(local, remote.files) };
      const backup = path.join(this.state, "backups", `${Date.now()}-${randomUUID()}.json`);
      writeJson(backup, { files: local, at: new Date().toISOString() });
      publish(this.home, this.state, Object.fromEntries(changed(local, remote.files).map(name => [name, remote.files[name] ?? null])));
      const next = { ...config, mode: "local", generation: randomUUID() };
      delete next.github;
      writeJson(this.configFile, next);
      return { mode: "local", directory: this.home, backup, from_revision: this.version(config, remote.oid) };
    }, { enabled: false });
  }
  // A project exists once it has MEMORY.md.
  async projectNames() {
    const project = name => /^projects\/([^/]+)\/MEMORY\.md$/u.exec(name)?.[1];
    return this.run(async config => {
      if (config.mode === "local") return new Set(Object.keys(scan(this.home)).map(project).filter(Boolean));
      const snapshot = await this.latest(config, { timeout: 1000 });
      return new Set(this.names(snapshot).map(project).filter(Boolean));
    }, { enabled: false, lockTimeout: 4000 });
  }
  // SessionStart reads one injected document; it can overlap a remote refresh in another process.
  async startup(name) {
    documentPath(name);
    return this.run(async config => {
      if (config.mode === "local") {
        const file = safeFile(this.home, name);
        return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      }
      const snapshot = await this.latest(config, { timeout: 1000 });
      await this.hydrate(config, snapshot, [name], { timeout: 1000, allowUnavailable: true });
      return snapshot.files[name] || "";
    }, { lockTimeout: 4000 });
  }
}
