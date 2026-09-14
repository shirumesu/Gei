import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { locations, readJson, writeJson, locked, recover, publish, scan, revisionOf, documentPath, storagePath, metadataPath, isDocument, safeFile, validateNames, fail, hash } from "./io.mjs";
import { GitHub } from "./github.mjs";
import { editHelp, rangeReplacements } from "./editing.mjs";
import { migrateDocument, initializeMetadata } from "./metadata.mjs";
import { inventory, gcPlan, applyReviews, assertDeletionLinks, scopePrefix } from "./maintenance.mjs";

const DEFAULTS = { enabled: true, mode: "local", generation: "initial", cacheSeconds: 60 };
const own = (object, key) => Object.hasOwn(object, key);
const knowledgePaths = names => [...new Set(names.map(name => isDocument(name) ? name : name.slice(9, -5)))];
const changed = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(name => a[name] !== b[name]);
// Git checkouts may convert LF to CRLF; only migration treats those bytes as equivalent.
const sameImportContent = (a, b) => typeof b === "string" && a.replaceAll("\r\n", "\n") === b.replaceAll("\r\n", "\n");
export class SpecStore {
  constructor({ env = process.env, github, clock = Date.now, ...options } = {}) {
    Object.assign(this, locations(env));
    this.github = github || new GitHub({ env, ...options });
    this.configFile = path.join(this.state, "config.json");
    this.clock = clock;
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
    if (typeof revision === "string" && /^r_[a-f0-9]{16}$/u.test(revision)) {
      const resolved = readJson(path.join(this.state, "revisions", `${revision}.json`));
      if (!resolved || resolved.coordinates !== "markdown" || resolved.target !== this.target(config) || !/^[a-f0-9]{40,64}$/u.test(resolved.oid)) fail("REVISION", "This revision is unavailable, uses an older document view, or belongs to another binding. Read the documents again.");
      return resolved.oid;
    }
    // Full references must identify the same physical Markdown coordinate contract.
    const prefix = this.target(config) + ":markdown:";
    if (typeof revision !== "string" || !revision.startsWith(prefix) || !/^[a-f0-9]{40,64}$/u.test(revision.slice(prefix.length))) {
      fail("REVISION", "Read from the current storage binding before editing.");
    }
    return revision.slice(prefix.length);
  }
  snapshotFile(config, oid) { return path.join(this.state, "snapshots", hash(this.target(config)), `${oid}.json`); }
  saveSnapshot(config, snapshot) { snapshot.storageFormat = 2; writeJson(this.snapshotFile(config, snapshot.oid), snapshot); return snapshot; }
  cachedSnapshot(config, oid) { const value = readJson(this.snapshotFile(config, oid)); return value?.storageFormat === 2 ? value : null; }
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
          storagePath(item.path);
          if (item.type !== "blob" || item.mode !== "100644") fail("INVALID_PATH", "Remote knowledge and metadata must be regular files.", { path: item.path });
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
    for (const item of tree) { storagePath(item.path); if (item.type !== "blob" || item.mode !== "100644") fail("INVALID_PATH", "Remote knowledge and metadata must be regular files."); }
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
  environment() {
    const file = path.join(this.state, "environment.json");
    let value = readJson(file);
    if (!value) { value = { id: randomUUID() }; writeJson(file, value); }
    return value.id;
  }
  maintenanceFile(config, prefix) { return path.join(this.state, "maintenance", hash(this.target(config) + ":" + prefix) + ".json"); }
  maintenanceHint(prefix) {
    const config = this.config();
    if (!config.enabled) return "";
    const previous = readJson(this.maintenanceFile(config, prefix));
    if (previous && this.clock() - previous.at < 7 * 86400000) return "";
    return `Maintenance check due: use Memo and spec_check with path_prefix ${prefix} for a bounded batch. Age alone never authorizes deletion.`;
  }
  async check({ path_prefix, revision, offset = 0, max_results = 10, checkout_root } = {}) {
    scopePrefix(path_prefix);
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(max_results) || max_results < 1 || max_results > 100 || (offset && !revision)) fail("ARGUMENT", "Use a revision for pagination and a batch of 1–100.");
    if (checkout_root && !/^projects\/[^/]+\/$/u.test(path_prefix)) fail("ARGUMENT", "Source checks need one explicit project scope and its checkout_root.");
    return this.run(async config => {
      const snapshot = await this.snapshot(config, revision);
      await this.hydrate(config, snapshot, this.names(snapshot));
      const environment = this.environment();
      const report = inventory(snapshot.files, path_prefix, { now: this.clock(), environment, checkoutRoot: checkout_root });
      const results = [];
      let bytes = 0;
      for (const item of report.results.slice(offset, offset + max_results)) {
        const size = Buffer.byteLength(JSON.stringify(item));
        if (results.length && bytes + size > 48000) break;
        results.push(item); bytes += size;
      }
      const counts = {};
      for (const item of report.results) for (const reason of item.reasons) counts[reason] = (counts[reason] || 0) + 1;
      if (!revision && !snapshot.stale) writeJson(this.maintenanceFile(config, path_prefix), { at: this.clock() });
      return { revision: this.version(config, snapshot.oid), source: snapshot.source, stale: Boolean(snapshot.stale),
        environment, path_prefix, documents: report.documents, candidates: report.results.length, cooling: report.cooling,
        gc_eligible: report.results.filter(item => item.action === "gc_eligible").length, counts, results,
        remaining: Math.max(0, report.results.length - offset - results.length),
        next_offset: offset + results.length < report.results.length ? offset + results.length : undefined };
    });
  }
  async gc({ path_prefix, base_revision, plan_id, apply = false } = {}) {
    scopePrefix(path_prefix);
    const plan = await this.run(async config => {
      const snapshot = await this.latest(config, { refresh: apply });
      if (apply && (!base_revision || this.oid(config, base_revision) !== snapshot.oid)) fail("REVISION_CONFLICT", "Preview GC and apply its current base_revision; nothing was deleted.", { applied: false });
      await this.hydrate(config, snapshot, this.names(snapshot));
      const result = gcPlan(snapshot.files, path_prefix, { now: this.clock(), environment: this.environment() });
      const planId = hash(JSON.stringify([path_prefix, result.changes]));
      if (apply && plan_id !== planId) fail("PLAN_CHANGED", "Preview cleanup again; its deletion or navigation set changed.", { applied: false });
      return { preview: !apply, revision: this.version(config, snapshot.oid), source: snapshot.source, stale: Boolean(snapshot.stale),
        path_prefix, plan_id: planId, deleted: result.deleted, declarations: result.declarations, navigation: result.navigation, blocked: result.blocked,
        edits: Object.entries(result.changes).map(([name, content]) => content === null ? { op: "delete", path: name } : { op: "replace", path: name, old_text: snapshot.files[name], new_text: content }) };
    });
    const { edits, ...visible } = plan;
    if (!apply || !edits.length) return { ...visible, applied: false };
    const result = await this.edit({ base_revision: plan.revision, summary: "Remove explicitly expired transient knowledge", edits });
    return { ...visible, ...result, preview: false };
  }
  async read({ paths, revision, start_line = 1, start_column = 1, max_lines = 200, line_numbers = false } = {}) {
    if (!Array.isArray(paths) || !paths.length || paths.length > 20) fail("ARGUMENT", "Read between 1 and 20 paths in one call.");
    paths.forEach(documentPath);
    if (typeof line_numbers !== "boolean") fail("ARGUMENT", "line_numbers must be a boolean.");
    if (!Number.isInteger(start_line) || start_line < 1 || !Number.isInteger(start_column) || start_column < 1 || !Number.isInteger(max_lines) || max_lines < 1 || max_lines > 1000) fail("ARGUMENT", "Use start_line/start_column >= 1 and max_lines between 1 and 1000.");
    return this.run(async config => {
      const snapshot = await this.snapshot(config, revision);
      await this.hydrate(config, snapshot, paths);
      return { revision: this.version(config, snapshot.oid), source: snapshot.source, stale: Boolean(snapshot.stale), checked_at: snapshot.checkedAt,
        files: paths.map(name => {
          const text = snapshot.files[name];
          if (text === undefined) return { path: name, exists: false };
          const lines = text.split("\n");
          const selected = [];
          let remaining = Math.floor(48000 / paths.length);
          let nextLine = start_line, nextColumn = start_column;
          for (let index = start_line - 1; index < Math.min(lines.length, start_line - 1 + max_lines); index++) {
            const chars = Array.from(lines[index]);
            const offset = index === start_line - 1 ? start_column - 1 : 0;
            if (offset > chars.length) fail("ARGUMENT", "start_column is beyond the selected line.", { path: name });
            const label = line_numbers ? `${index + 1}: ` : "";
            let available = remaining - (selected.length ? 1 : 0) - Buffer.byteLength(label);
            if (available < 0) break;
            let end = offset;
            while (end < chars.length && Buffer.byteLength(chars[end]) <= available) { available -= Buffer.byteLength(chars[end]); end++; }
            if (end === offset && chars.length > offset) break;
            const segment = chars.slice(offset, end).join("");
            selected.push(label + (line_numbers ? segment.replace(/\r$/u, "") : segment)); remaining = available;
            nextLine = end < chars.length ? index + 1 : index + 2;
            nextColumn = end < chars.length ? end + 1 : 1;
            if (end < chars.length) break;
          }
          const truncated = nextLine <= lines.length;
          return { path: name, exists: true, content: selected.join("\n"), start_line, total_lines: lines.length,
            ...(line_numbers ? { line_numbers: true } : {}),
            start_column, truncated, next_line: truncated ? nextLine : undefined, next_column: truncated ? nextColumn : undefined };
        }) };
    });
  }
  async search({ query = "", path_prefix = "projects/", revision, max_results = 30 } = {}) {
    if (typeof query !== "string" || typeof path_prefix !== "string" || !/^(projects\/|context\/)/u.test(path_prefix) || path_prefix.includes("..") || path_prefix.includes("\\")) fail("ARGUMENT", "Use a literal query and a projects/ or context/ path prefix.");
    if (!Number.isInteger(max_results) || max_results < 1 || max_results > 100) fail("ARGUMENT", "max_results must be between 1 and 100.");
    return this.run(async config => {
      const snapshot = await this.snapshot(config, revision);
      const names = this.names(snapshot).filter(name => isDocument(name) && name.startsWith(path_prefix));
      const results = [];
      for (const name of names) {
        if (!query) results.push({ path: name });
        else {
          await this.hydrate(config, snapshot, [name]);
          for (const [index, line] of snapshot.files[name].split("\n").entries()) {
            const match = line.toLowerCase().indexOf(query.toLowerCase());
            if (match >= 0) {
              const chars = Array.from(line);
              const column = Array.from(line.slice(0, match)).length;
              const start = Math.max(0, column - 100);
              const end = Math.min(chars.length, Math.max(column + Array.from(query).length, start + 400));
              results.push({ path: name, line: index + 1, text: chars.slice(start, Math.min(end, start + 800)).join(""),
                match_column: column + 1, snippet_start_column: start + 1, snippet_truncated: start > 0 || end < chars.length || end > start + 800 });
            }
            if (results.length > max_results) break;
          }
        }
        if (results.length > max_results) break;
      }
      return { revision: this.version(config, snapshot.oid), source: snapshot.source, stale: Boolean(snapshot.stale),
        results: results.slice(0, max_results), truncated: results.length > max_results };
    });
  }
  async edit({ base_revision, summary, edits = [], reviews = [], checkout_root } = {}) {
    if (typeof summary !== "string" || !summary.trim() || summary.length > 200 || /[\r\n]/u.test(summary)) fail("ARGUMENT", "Provide a concise, single-line summary (1–200 characters).");
    if (!Array.isArray(edits) || !Array.isArray(reviews) || !edits.length && !reviews.length || edits.length + reviews.length > 100) fail("ARGUMENT", "Provide between 1 and 100 edits/reviews.");
    for (const edit of edits) { documentPath(edit.path); if (edit.op === "rename") documentPath(edit.to); if (!["replace", "replace_lines", "create", "delete", "rename"].includes(edit.op)) fail("ARGUMENT", "Edit op must be replace, replace_lines, create, delete, or rename."); }
    return this.run(async config => {
      const expected = this.oid(config, base_revision);
      const current = await this.latest(config, { refresh: true });
      if (current.oid !== expected) {
        const base = this.cachedSnapshot(config, expected);
        const versions = snapshot => snapshot.tree ? Object.fromEntries(snapshot.tree.map(item => [item.path, item.sha])) : snapshot.files;
        fail("REVISION_CONFLICT", "Knowledge changed. Read the changed documents and reconcile before retrying. Nothing was applied.",
          { applied: false, current_revision: this.version(config, current.oid), changed_paths: base ? knowledgePaths(changed(versions(base), versions(current))) : undefined });
      }
      const deleting = edits.some(edit => edit.op === "delete" || edit.op === "rename") || reviews.some(review => review.outcome === "delete");
      const touched = [...new Set([...edits.flatMap(edit => edit.to ? [edit.path, edit.to] : [edit.path]), ...reviews.map(review => review.path)])];
      await this.hydrate(config, current, deleting ? this.names(current) : touched.flatMap(name => [name, metadataPath(name)]));
      const revision = this.version(config, current.oid);
      const bases = { ...current.files };
      const ranges = rangeReplacements(current.files, edits, revision);
      const result = { ...current.files };
      for (const [index, edit] of edits.entries()) {
        const exists = own(result, edit.path);
        const error = (code, message, extra = {}) => fail(code, message, { applied: false, edit_index: index, path: edit.path, ...extra });
        if (edit.op === "replace_lines") {
          result[edit.path] = ranges.get(edit.path);
        } else if (edit.op === "create") {
          if (exists || own(result, metadataPath(edit.path))) error("EXISTS", "The document or its lifecycle record already exists; reconcile it before creating.");
          if (typeof edit.content !== "string") error("ARGUMENT", "create requires content.");
          result[edit.path] = edit.content; delete bases[edit.path];
        } else {
          if (!exists) error("NOT_FOUND", "Read or create this document before editing it.");
          if (edit.op === "delete") { delete result[edit.path]; delete result[metadataPath(edit.path)]; delete bases[edit.path]; }
          else if (edit.op === "rename") {
            if (own(result, edit.to) || own(result, metadataPath(edit.to))) error("EXISTS", "The rename destination already has content or lifecycle state.");
            bases[edit.to] = bases[edit.path]; delete bases[edit.path];
            result[edit.to] = result[edit.path]; delete result[edit.path];
            if (own(result, metadataPath(edit.path))) {
              result[metadataPath(edit.to)] = result[metadataPath(edit.path)]; delete result[metadataPath(edit.path)];
            }
          } else {
            if (typeof edit.old_text !== "string" || !edit.old_text || typeof edit.new_text !== "string") error("ARGUMENT", "replace requires nonempty old_text and a string new_text.");
            let matches = 0;
            for (let at = result[edit.path].indexOf(edit.old_text); at >= 0; at = result[edit.path].indexOf(edit.old_text, at + 1)) matches++;
            if (matches !== 1) error(matches ? "AMBIGUOUS_MATCH" : "NO_MATCH", "old_text must match exactly once. Use the base context below, or reread with line numbers and use replace_lines.", { matches, ...editHelp(current.files[edit.path], edit, revision) });
            result[edit.path] = result[edit.path].replace(edit.old_text, () => edit.new_text);
          }
        }
        if (result[edit.path] !== undefined && Buffer.byteLength(result[edit.path]) > 1024 * 1024) error("TOO_LARGE", "Knowledge documents must be at most 1 MiB.");
      }
      for (const name of touched) {
        if (result[name] === undefined) continue;
        // Derive lifecycle state from the original document, including across ordered moves.
        const original = { [name]: bases[name] ?? result[name], [metadataPath(name)]: result[metadataPath(name)] };
        if (migrateDocument(original, name)) {
          result[metadataPath(name)] = original[metadataPath(name)];
          const edited = { [name]: result[name] };
          migrateDocument(edited, name);
          result[name] = edited[name];
        }
        initializeMetadata(result, name, this.clock());
      }
      applyReviews(current.files, result, reviews, { now: this.clock(), environment: this.environment(), checkoutRoot: checkout_root });
      if (deleting) assertDeletionLinks(current.files, result);
      return this.commitChanges(config, current, result, summary, { deleting });
    });
  }
  async commitChanges(config, current, result, summary, { deleting = false } = {}) {
    for (const [name, content] of Object.entries(result)) if (Buffer.byteLength(content) > 1024 * 1024) fail("TOO_LARGE", "Knowledge and metadata files must be at most 1 MiB.", { path: name });
    const changes = Object.fromEntries(changed(current.files, result).map(name => [name, result[name] ?? null]));
    const finalNames = new Set(this.names(current));
    for (const [name, content] of Object.entries(changes)) { if (content === null) finalNames.delete(name); else finalNames.add(name); }
    validateNames([...finalNames]);
    if (!Object.keys(changes).length) return { applied: false, unchanged: true, revision: this.version(config, current.oid), paths: [] };
    if (config.mode === "local") {
      const backup = deleting ? this.backupDeletion(config, current.files, changes) : undefined;
      publish(this.home, this.state, changes);
      const next = await this.latest(config);
      return { applied: true, source: "local", revision: this.version(config, next.oid), paths: knowledgePaths(Object.keys(changes)), backup };
    }
    let commit;
    try { commit = await this.github.commit(config.github, current.oid, changes, summary); }
    catch (error) {
      // A lost response may follow a successful commit. Never blindly resubmit it.
      try {
        const actual = await this.latest(config, { refresh: true });
        await this.hydrate(config, actual, Object.keys(changes));
        if (Object.entries(changes).every(([name, content]) => content === null ? !this.names(actual).includes(name) : actual.files[name] === content)) {
          return { applied: true, verified_after_retry: true, source: "github", revision: this.version(config, actual.oid), paths: knowledgePaths(Object.keys(changes)) };
        }
        if (actual.oid !== current.oid) fail("REVISION_CONFLICT", "The branch changed during submission. Read the latest documents before retrying.", { applied: false, current_revision: this.version(config, actual.oid) });
      } catch (probe) { if (probe.code === "REVISION_CONFLICT") throw probe; }
      fail("SUBMISSION_UNCONFIRMED", "GitHub submission was not confirmed. Read the latest documents before retrying; no local fallback write was made.", { cause: error.code });
    }
    let next;
    try { next = await this.snapshot(config, this.version(config, commit.oid)); }
    catch { return { applied: true, source: "github", revision: this.version(config, commit.oid), paths: knowledgePaths(Object.keys(changes)), url: commit.url, cache_updated: false }; }
    next.files = result;
    this.saveSnapshot(config, next);
    writeJson(this.headFile(config), { oid: commit.oid, checkedAt: new Date().toISOString() });
    return { applied: true, source: "github", revision: this.version(config, commit.oid), paths: knowledgePaths(Object.keys(changes)), url: commit.url };
  }
  async migrateMetadata({ path_prefix = "all", base_revision, apply = false } = {}) {
    const selected = scopePrefix(path_prefix);
    return this.run(async config => {
      const current = await this.latest(config, { refresh: true });
      if (apply && (!base_revision || this.oid(config, base_revision) !== current.oid)) fail("REVISION_CONFLICT", "Preview metadata migration and apply its current base_revision.", { applied: false });
      const names = this.names(current).filter(name => isDocument(name) && selected(name));
      await this.hydrate(config, current, names.flatMap(name => [name, metadataPath(name)]));
      const result = { ...current.files }, migrated = [], blocked = [];
      for (const name of names) {
        try { if (migrateDocument(result, name)) migrated.push(name); }
        catch (error) { if (error.code !== "METADATA_CONFLICT") throw error; blocked.push(name); }
      }
      const preview = { preview: !apply, revision: this.version(config, current.oid), path_prefix, migrated, blocked };
      if (!apply) return preview;
      if (blocked.length) fail("METADATA_CONFLICT", "Resolve conflicting lifecycle records before applying this migration.", { paths: blocked, applied: false });
      return { ...preview, ...await this.commitChanges(config, current, result, "Move lifecycle metadata out of Markdown") };
    });
  }
  backupDeletion(config, before, changes) {
    const root = path.join(this.state, "deletions");
    fs.mkdirSync(root, { recursive: true });
    for (const file of fs.readdirSync(root)) {
      if (!/^\d+-[a-f0-9-]+\.json$/u.test(file)) continue;
      if (Number(file.split("-")[0]) < this.clock() - 30 * 86400000) fs.rmSync(path.join(root, file));
    }
    const id = `${this.clock()}-${randomUUID()}`;
    writeJson(path.join(root, id + ".json"), { at: this.clock(), target: this.target(config),
      before: Object.fromEntries(Object.keys(changes).map(name => [name, before[name] ?? null])), after: changes });
    return id;
  }
  async restore({ backup, apply = false } = {}) {
    return this.run(async config => {
      if (config.mode !== "local") fail("CONFIG", "Use the selected GitHub repository's commit history for remote recovery.");
      const root = path.join(this.state, "deletions");
      if (!backup) return { backups: fs.existsSync(root) ? fs.readdirSync(root).filter(file => /^\d+-[a-f0-9-]+\.json$/u.test(file) && Number(file.split("-")[0]) >= this.clock() - 30 * 86400000).map(file => file.slice(0, -5)) : [] };
      if (!/^\d+-[a-f0-9-]+$/u.test(backup)) fail("ARGUMENT", "Use a listed backup identifier.");
      const saved = readJson(path.join(root, backup + ".json"));
      if (!saved || saved.target !== this.target(config) || saved.at < this.clock() - 30 * 86400000) fail("BACKUP", "Backup is unavailable for this binding or has expired.");
      const current = await this.latest(config);
      const conflicts = Object.keys(saved.after).filter(name => (current.files[name] ?? null) !== saved.after[name]);
      if (apply && conflicts.length) fail("REVISION_CONFLICT", "Recovery would overwrite later changes; reconcile them first.", { paths: conflicts });
      const visible = { preview: !apply, backup, revision: this.version(config, current.oid), paths: Object.keys(saved.before), conflicts };
      if (!apply) return visible;
      const restored = { ...current.files };
      for (const [name, content] of Object.entries(saved.before)) {
        if (content === null) delete restored[name]; else restored[name] = content;
      }
      validateNames(Object.keys(restored));
      assertDeletionLinks(current.files, restored);
      // Recovery restores the exact preimages, including their lifecycle state.
      publish(this.home, this.state, saved.before);
      const next = await this.latest(config);
      return { ...visible, applied: true, source: "local", revision: this.version(config, next.oid) };
    });
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
  async index(name, { allocate = false, initialContent } = {}) {
    documentPath(name);
    // SessionStart knowledge hooks can overlap a remote refresh in another process.
    return this.run(async config => {
      if (config.mode === "local") {
        const file = safeFile(this.home, name);
        if (!fs.existsSync(file) && allocate) {
          const files = { [name]: initialContent || `# ${name.split("/")[1]}\n\nAgent workspace allocated. Add reliable background and topic routes as work establishes them.\n` };
          const existing = safeFile(this.home, metadataPath(name));
          if (fs.existsSync(existing)) files[metadataPath(name)] = fs.readFileSync(existing, "utf8");
          initializeMetadata(files, name, this.clock());
          publish(this.home, this.state, files);
        }
        const available = fs.existsSync(file);
        return { content: available ? fs.readFileSync(file, "utf8") : "", mode: "local", source: "local", stale: false, available };
      }
      let snapshot = await this.latest(config, { timeout: 1000 });
      await this.hydrate(config, snapshot, [name], { timeout: 1000, allowUnavailable: true });
      return { content: snapshot.files[name] || "", revision: this.version(config, snapshot.oid), mode: config.mode,
        source: snapshot.source, stale: Boolean(snapshot.stale), checkedAt: snapshot.checkedAt, available: own(snapshot.files, name) };
    }, { lockTimeout: 4000 });
  }
}
