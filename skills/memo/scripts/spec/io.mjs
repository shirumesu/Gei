import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";

export class SpecError extends Error {
  constructor(code, message, details = {}) { super(message); this.code = code; this.details = details; }
}
export const fail = (code, message, details) => { throw new SpecError(code, message, details); };
export const hash = value => createHash("sha256").update(value).digest("hex");
export const readJson = (file, fallback = null) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
};
export function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary, content, { flag: "wx", mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { fs.rmSync(temporary, { force: true }); }
}
export const writeJson = (file, value) => atomicWrite(file, JSON.stringify(value, null, 2) + "\n");
export function locations(env = process.env) {
  const expand = value => value.replace(/^~(?=$|[\\/])/u, os.homedir());
  const home = path.resolve(expand(env.GEI_SPEC_HOME || path.join(os.homedir(), ".agents/geispec")));
  const state = path.resolve(expand(env.GEI_SPEC_STATE || path.join(os.homedir(), ".agents/gei-state", hash(home).slice(0, 16))));
  if (state === home || state.startsWith(home + path.sep)) fail("CONFIG", "Spec state must be outside the knowledge directory.");
  return { home, state };
}
export function documentPath(value) {
  if (typeof value !== "string" || !/^(projects\/[^/]+\/|context\/).+\.md$/u.test(value)
      || value.includes("\\") || value.split("/").some(part => !part || part === "." || part === ".." || /[\x00-\x1f<>:"|?*]/u.test(part))) {
    fail("INVALID_PATH", "Use a Markdown path under projects/<project>/ or context/.", { path: value });
  }
  return value;
}
export const isDocument = value => /^(projects\/[^/]+\/|context\/).+\.md$/u.test(value);
export const metadataPath = name => `metadata/${documentPath(name)}.json`;
export function storagePath(value) {
  if (typeof value === "string" && value.startsWith("metadata/") && value.endsWith(".md.json")) {
    documentPath(value.slice(9, -5));
    return value;
  }
  return documentPath(value);
}
export function safeFile(root, relative) {
  storagePath(relative);
  let current = root;
  const parts = relative.split("/");
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) fail("INVALID_PATH", "Knowledge paths cannot traverse symbolic links.", { path: relative });
      if (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) fail("INVALID_PATH", "A document path conflicts with an existing file or directory.", { path: relative });
    }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return current;
}
export function scan(root) {
  const files = {};
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (item.isSymbolicLink()) fail("INVALID_PATH", "Knowledge cannot contain symbolic links.", { path: prefix + item.name });
      if (item.isDirectory()) walk(path.join(dir, item.name), prefix + item.name + "/");
      else if (item.isFile() && (prefix.startsWith("metadata/") ? item.name.endsWith(".json") : item.name.endsWith(".md"))) {
        const name = storagePath(prefix + item.name);
        const file = safeFile(root, name);
        if (fs.statSync(file).size > 1024 * 1024) fail("TOO_LARGE", "Knowledge documents must be at most 1 MiB.", { path: name });
        files[name] = fs.readFileSync(file, "utf8");
      }
    }
  }
  for (const prefix of ["projects", "context", "metadata"]) walk(path.join(root, prefix), prefix + "/");
  return files;
}
export const revisionOf = files => hash(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))));

export function validateNames(names) {
  const portable = names.map(name => storagePath(name).normalize("NFKC").toLowerCase()).sort();
  if (new Set(portable).size !== portable.length) fail("INVALID_PATH", "Document paths must remain distinct on case-insensitive filesystems.", { applied: false });
  const paths = new Set(portable);
  for (const name of portable) {
    const parts = name.split("/");
    for (let i = 1; i < parts.length; i++) if (paths.has(parts.slice(0, i).join("/"))) fail("INVALID_PATH", "A document cannot also be a parent directory.", { path: name, applied: false });
  }
}

// All runtime readers and writers share this process lock, including separate MCP instances.
export async function locked(state, action, timeout = 15000) {
  fs.mkdirSync(state, { recursive: true });
  const lock = path.join(state, "operation.lock");
  const owner = { pid: process.pid, id: randomUUID() };
  const candidate = path.join(state, `owner-${owner.id}.tmp`);
  fs.writeFileSync(candidate, JSON.stringify(owner), { flag: "wx", mode: 0o600 });
  const start = Date.now();
  const alive = pid => {
    try { process.kill(pid, 0); return true; }
    catch (error) { return error.code !== "ESRCH"; }
  };
  const readOwner = file => {
    const value = readJson(file);
    if (value && (!Number.isInteger(value.pid) || value.pid <= 0 || typeof value.id !== "string")) fail("LOCK", "Invalid Spec lock owner.");
    return value;
  };
  // Recovery claims belong to an immutable owner ID, never to a reusable lock path.
  // A recovery process that dies can itself be claimed without deleting a successor's lock.
  const claimRecovery = previous => {
    fs.mkdirSync(path.join(state, "reclaims"), { recursive: true });
    let claimant = previous;
    while (!alive(claimant.pid)) {
      const claim = path.join(state, "reclaims", hash(claimant.id) + ".json");
      try { fs.linkSync(candidate, claim); return true; }
      catch (error) { if (error.code !== "EEXIST") throw error; claimant = readOwner(claim); }
    }
    return false;
  };
  let acquired = false;
  try {
    while (!acquired) {
      try { fs.linkSync(candidate, lock); acquired = true; }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        const previous = readOwner(lock);
        if (!previous) continue;
        if (!alive(previous.pid) && claimRecovery(previous)) {
          if (readOwner(lock)?.id === previous.id) fs.rmSync(lock, { force: true });
          continue;
        }
        if (Date.now() - start >= timeout) fail("BUSY", "Another Spec operation is still running; retry shortly.");
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    return await action();
  } finally {
    if (acquired && readOwner(lock)?.id === owner.id) fs.rmSync(lock, { force: true });
    fs.rmSync(candidate, { force: true });
  }
}

export function recover(home, state) {
  const journal = path.join(state, "transaction.json");
  const pending = readJson(journal);
  if (!pending) return;
  for (const [name, content] of Object.entries(pending.files)) {
    const file = safeFile(home, name);
    if (content === null) {
      fs.rmSync(file, { force: true });
      if (name.startsWith("metadata/")) {
        const root = path.join(home, "metadata");
        for (let directory = path.dirname(file); directory === root || directory.startsWith(root + path.sep); directory = path.dirname(directory)) {
          try { fs.rmdirSync(directory); }
          catch (error) { if (error.code !== "ENOENT") break; }
        }
      }
    } else atomicWrite(file, content);
  }
  fs.rmSync(journal);
}
export function publish(home, state, files) {
  const final = new Set(Object.keys(scan(home)));
  for (const [name, content] of Object.entries(files)) {
    safeFile(home, name);
    if (content === null) final.delete(name); else final.add(name);
  }
  validateNames([...final]);
  writeJson(path.join(state, "transaction.json"), { files });
  recover(home, state);
}
