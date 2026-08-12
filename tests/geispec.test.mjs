import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ensureContext,
  ensureProject,
  findProjectGroups,
  getGeiSpecHome,
  projectIdForRoot,
} from "../hooks/geispec.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const overviewHook = path.join(repoRoot, "hooks", "inject_overview.mjs");
const memoryHook = path.join(repoRoot, "hooks", "inject_memory.mjs");
const temporaryRoots = [];

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "geispec-test-"));
  temporaryRoots.push(root);
  return root;
}

function runHook(script, args, env, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify({ cwd, source: "startup" }));
  });
}

function contextFrom(result) {
  assert.equal(result.status, 0, result.stderr);
  return result.stdout
    ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext
    : "";
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    fs.rmSync(temporaryRoots.pop(), { recursive: true, force: true });
  }
});

test("GEI_SPEC_HOME expands a leading tilde", () => {
  assert.equal(
    getGeiSpecHome({ GEI_SPEC_HOME: "~/custom-geispec" }),
    path.resolve(os.homedir(), "custom-geispec"),
  );
});

test("Session initialization creates a fixed external Project scaffold", () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "Example Project");
  const geiSpecHome = path.join(root, "store");
  fs.mkdirSync(projectRoot, { recursive: true });

  const project = ensureProject(projectRoot, {
    env: { GEI_SPEC_HOME: geiSpecHome },
  });

  assert.equal(project.projectId, projectIdForRoot(projectRoot));
  assert.equal(project.specRoot, project.projectDir);
  assert.equal(project.manifest.root, fs.realpathSync.native(projectRoot));
  assert.deepEqual(
    fs.readdirSync(project.specRoot).sort(),
    ["IMPACTS.md", "MEMORY.md", "OVERVIEW.md", "docs", "memory", "project.json"],
  );
  assert.match(
    fs.readFileSync(path.join(project.specRoot, "OVERVIEW.md"), "utf8"),
    /gei:uninitialized/,
  );
  assert.equal(fs.existsSync(path.join(project.specRoot, "spec")), false);
  assert.equal(fs.existsSync(path.join(geiSpecHome, "bindings.json")), false);
});

test("initialization preserves existing content and restores only missing files", () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "project");
  const env = { GEI_SPEC_HOME: path.join(root, "store") };
  fs.mkdirSync(projectRoot, { recursive: true });
  const project = ensureProject(projectRoot, { env });
  const overviewPath = path.join(project.specRoot, "OVERVIEW.md");
  const impactsPath = path.join(project.specRoot, "IMPACTS.md");
  fs.writeFileSync(overviewPath, "# Custom Overview\n", "utf8");
  fs.rmSync(impactsPath);

  ensureProject(projectRoot, { env });

  assert.equal(fs.readFileSync(overviewPath, "utf8"), "# Custom Overview\n");
  assert.match(fs.readFileSync(impactsPath, "utf8"), /# Project Impact Map/);
});

test("exact working directories receive distinct Projects", () => {
  const root = temporaryRoot();
  const parent = path.join(root, "parent");
  const nested = path.join(parent, "nested");
  const env = { GEI_SPEC_HOME: path.join(root, "store") };
  fs.mkdirSync(nested, { recursive: true });

  const parentProject = ensureProject(parent, { env });
  const nestedProject = ensureProject(nested, { env });

  assert.notEqual(parentProject.projectId, nestedProject.projectId);
  assert.notEqual(parentProject.specRoot, nestedProject.specRoot);
});

test("empty Context, Group, and Memory layers emit no hook output", async () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "project");
  const geiSpecHome = path.join(root, "store");
  const env = { GEI_SPEC_HOME: geiSpecHome };
  fs.mkdirSync(projectRoot, { recursive: true });
  const project = ensureProject(projectRoot, { env });
  ensureContext({ env });

  const groupDir = path.join(geiSpecHome, "groups", "empty-group");
  fs.mkdirSync(groupDir, { recursive: true });
  fs.writeFileSync(
    path.join(groupDir, "group.json"),
    JSON.stringify({
      schemaVersion: 2,
      id: "empty-group",
      name: "Empty Group",
      members: [{ project: project.projectId, role: "member" }],
    }),
  );
  fs.writeFileSync(
    path.join(groupDir, "OVERVIEW.md"),
    "# Group Overview\n\n<!-- gei:empty -->\n",
  );
  fs.writeFileSync(
    path.join(groupDir, "MEMORY.md"),
    "# Group Memory\n\n<!-- gei:empty -->\n",
  );

  const results = await Promise.all([
    runHook(memoryHook, ["context"], env, projectRoot),
    runHook(overviewHook, ["group"], env, projectRoot),
    runHook(memoryHook, ["group"], env, projectRoot),
    runHook(memoryHook, ["project"], env, projectRoot),
  ]);

  for (const result of results) {
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
  }
});

test("Project Overview bootstrap is injected on the first session", async () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "empty-project");
  const env = { GEI_SPEC_HOME: path.join(root, "store") };
  fs.mkdirSync(projectRoot, { recursive: true });

  const result = await runHook(overviewHook, ["project"], env, projectRoot);
  const context = contextFrom(result);

  assert.match(context, /GeiSpec project context/);
  assert.match(context, /gei:uninitialized/);
  assert.match(context, /read IMPACTS\.md/i);
});

test("meaningful Group context is shared while Project context stays local", async () => {
  const root = temporaryRoot();
  const geiSpecHome = path.join(root, "store");
  const env = { GEI_SPEC_HOME: geiSpecHome };
  const frontendRoot = path.join(root, "frontend");
  const apiRoot = path.join(root, "api");
  fs.mkdirSync(frontendRoot, { recursive: true });
  fs.mkdirSync(apiRoot, { recursive: true });
  const frontend = ensureProject(frontendRoot, { env });
  const api = ensureProject(apiRoot, { env });
  fs.writeFileSync(
    path.join(frontend.specRoot, "MEMORY.md"),
    "# Project Memory\n\n## Index\n\n- Frontend only rule.\n",
  );
  fs.writeFileSync(
    path.join(api.specRoot, "MEMORY.md"),
    "# Project Memory\n\n## Index\n\n- API only rule.\n",
  );

  const groupDir = path.join(geiSpecHome, "groups", "product-x");
  fs.mkdirSync(groupDir, { recursive: true });
  fs.writeFileSync(
    path.join(groupDir, "group.json"),
    JSON.stringify({
      schemaVersion: 2,
      id: "product-x",
      name: "Product X",
      members: [
        { project: frontend.projectId, role: "frontend" },
        { project: api.projectId, role: "api" },
      ],
    }),
  );
  fs.writeFileSync(
    path.join(groupDir, "OVERVIEW.md"),
    "# Group Overview\n\n## Shared Purpose\n\nShip Product X.\n",
  );
  fs.writeFileSync(
    path.join(groupDir, "MEMORY.md"),
    "# Group Memory\n\n## Index\n\n- Keep the schema synchronized.\n",
  );

  assert.equal(findProjectGroups(frontend).length, 1);
  const frontendGroup = contextFrom(
    await runHook(overviewHook, ["group"], env, frontendRoot),
  );
  const apiGroup = contextFrom(
    await runHook(memoryHook, ["group"], env, apiRoot),
  );
  const frontendMemory = contextFrom(
    await runHook(memoryHook, ["project"], env, frontendRoot),
  );

  assert.match(frontendGroup, /Ship Product X/);
  assert.match(frontendGroup, /frontend/);
  assert.match(frontendGroup, /api/);
  assert.match(apiGroup, /Keep the schema synchronized/);
  assert.match(frontendMemory, /Frontend only rule/);
  assert.doesNotMatch(frontendMemory, /API only rule/);
});

test("parallel SessionStart content hooks initialize one complete Project", async () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "parallel-project");
  const geiSpecHome = path.join(root, "store");
  const env = { GEI_SPEC_HOME: geiSpecHome };
  fs.mkdirSync(projectRoot, { recursive: true });

  const results = await Promise.all([
    runHook(memoryHook, ["context"], env, projectRoot),
    runHook(overviewHook, ["group"], env, projectRoot),
    runHook(memoryHook, ["group"], env, projectRoot),
    runHook(overviewHook, ["project"], env, projectRoot),
    runHook(memoryHook, ["project"], env, projectRoot),
  ]);
  for (const result of results) assert.equal(result.status, 0, result.stderr);

  const projectDir = path.join(
    geiSpecHome,
    "projects",
    projectIdForRoot(projectRoot),
  );
  assert.doesNotThrow(() =>
    JSON.parse(fs.readFileSync(path.join(projectDir, "project.json"), "utf8")),
  );
  for (const name of ["OVERVIEW.md", "IMPACTS.md", "MEMORY.md"]) {
    assert.equal(fs.existsSync(path.join(projectDir, name)), true, name);
  }
});

test("SessionStart content hooks return useful initialization errors", async () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "project");
  const blockedStore = path.join(root, "not-a-directory");
  const env = { GEI_SPEC_HOME: blockedStore };
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(blockedStore, "blocks GeiSpec directory creation\n");

  const results = await Promise.all([
    runHook(overviewHook, ["project"], env, projectRoot),
    runHook(memoryHook, ["context"], env, projectRoot),
  ]);

  for (const result of results) {
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.match(
      output.systemMessage,
      /^Gei (project overview|context memory) initialization failed/,
    );
    assert.match(output.systemMessage, /not-a-directory/);
  }
});

test("project-local legacy Spec is ignored", async () => {
  const root = temporaryRoot();
  const projectRoot = path.join(root, "project");
  const env = { GEI_SPEC_HOME: path.join(root, "store") };
  fs.mkdirSync(path.join(projectRoot, "spec"), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, "spec", "OVERVIEW.md"),
    "# Legacy content must not load\n",
  );

  const context = contextFrom(
    await runHook(overviewHook, ["project"], env, projectRoot),
  );

  assert.match(context, /gei:uninitialized/);
  assert.doesNotMatch(context, /Legacy content must not load/);
});

test("hook configs keep six independent SessionStart handlers", () => {
  for (const file of ["codex-hooks.json", "hooks.json"]) {
    const config = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "hooks", file), "utf8"),
    );
    const handlers = config.hooks.SessionStart[0].hooks;
    assert.equal(handlers.length, 6, file);
    assert.deepEqual(
      handlers.map((handler) => handler.statusMessage),
      [
        "Loading Gei router",
        "Loading Gei shared memory",
        "Loading Gei group overview",
        "Loading Gei group memory",
        "Loading Gei project overview",
        "Loading Gei project memory",
      ],
    );
  }
});
