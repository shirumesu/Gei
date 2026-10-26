import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { SourceDrift } from "../skills/memo/scripts/spec/maintenance.mjs";
import { SpecStore } from "../skills/memo/scripts/spec/store.mjs";
import { callTool } from "../skills/memo/scripts/spec/tools.mjs";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

function doc({ type = "facts", description = "A durable fact about the example checkout.", status, title = "Example fact", body = "The body states one fact.\n", sources } = {}) {
  const lines = ["---", `type: ${type}`, `description: ${description}`];
  if (status) lines.push(`status: ${status}`);
  if (sources) {
    lines.push("sources:");
    for (const source of sources) lines.push(`  - ${source}`);
  }
  lines.push("---", `# ${title}`, "", body);
  return lines.join("\n");
}

async function withStore(run) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "gei-edit-"));
  const home = path.join(parent, "knowledge");
  const state = path.join(parent, "state");
  fs.mkdirSync(home);
  const store = new SpecStore({ env: { ...process.env, GEI_SPEC_HOME: home, GEI_SPEC_STATE: state } });
  let revision = "";
  const refresh = async () => {
    const current = await callTool(store, "spec_read", { paths: ["projects/example/INDEX.md"] });
    revision = current.revision;
    return current;
  };
  const write = async (relative, text) => {
    const file = path.join(home, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    await refresh();
  };
  const edit = async (edits, summary = "Update example knowledge") => {
    const result = await callTool(store, "spec_edit", { base_revision: revision, summary, edits });
    revision = result.revision;
    return result;
  };
  const reject = async (edits, code, check, summary = "Expect a rejected edit") => {
    let caught;
    try {
      await callTool(store, "spec_edit", { base_revision: revision, summary, edits });
    } catch (error) { caught = error; }
    assert.ok(caught, "expected spec_edit to reject");
    assert.equal(caught.code, code, caught.message);
    assert.equal(caught.details?.applied, false);
    if (check) check(caught);
    return caught;
  };
  const text = relative => fs.readFileSync(path.join(home, relative), "utf8");
  try {
    await refresh();
    await run({ home, store, write, edit, reject, text, refresh });
  } finally { fs.rmSync(parent, { recursive: true, force: true }); }
}

function problems(error, docPath) {
  const found = error.details.documents.find(item => item.path === docPath);
  assert.ok(found, error.message);
  return found.problems;
}

test("create without frontmatter is rejected", async () => {
  await withStore(async ({ reject, home }) => {
    const target = "projects/example/notes/brand-new.md";
    await reject([{ op: "create", path: target, content: "# Brand new subject\n\nNo header yet.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, target), ["Add YAML frontmatter with type (facts, decisions, runbooks, log, or tasks) and a one-line description."]);
    });
    assert.equal(fs.existsSync(path.join(home, target)), false);
  });
});

test("create rejects a missing type, an invalid type, and a repeated type", async () => {
  await withStore(async ({ reject }) => {
    const missing = "projects/example/notes/missing-type.md";
    await reject([{ op: "create", path: missing, content: "---\ndescription: A note that names no type.\n---\n# Missing type\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, missing), ["Add type: facts, decisions, runbooks, log, or tasks."]);
    });
    for (const type of ["task", "FACTS", "Facts"]) {
      const target = `projects/example/notes/bad-${type.toLowerCase()}.md`;
      await reject([{ op: "create", path: target, content: doc({ type, title: `${type} title case`, description: `Invalid type token ${type} on a new note.` }) }], "FRONTMATTER", error => {
        assert.deepEqual(problems(error, target), ["Set type to one of facts, decisions, runbooks, log, tasks."]);
      });
    }
    const repeated = "projects/example/notes/repeated-type.md";
    await reject([{ op: "create", path: repeated, content: "---\ntype: facts\ntype: decisions\ndescription: Two type keys is not a choice.\n---\n# Repeated type\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, repeated), ["Set type once."]);
    });
  });
});

test("create rejects a missing, empty, multiline, or repeated description", async () => {
  await withStore(async ({ reject }) => {
    const missing = "projects/example/notes/missing-description.md";
    await reject([{ op: "create", path: missing, content: "---\ntype: facts\n---\n# Missing description\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, missing), ["Add a one-line description."]);
    });
    for (const description of ["", "   ", '""']) {
      const target = "projects/example/notes/empty-description.md";
      await reject([{ op: "create", path: target, content: `---\ntype: facts\ndescription: ${description}\n---\n# Empty description\n\nBody.\n` }], "FRONTMATTER", error => {
        assert.deepEqual(problems(error, target), ["Set description to one non-empty line."]);
      });
    }
    const block = "projects/example/notes/block-description.md";
    await reject([{ op: "create", path: block, content: "---\ntype: facts\ndescription: |\n  Two lines cannot feed an index.\n---\n# Block description\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, block), ["Set description to one non-empty line."]);
    });
    const indented = "projects/example/notes/indented-description.md";
    await reject([{ op: "create", path: indented, content: "---\ntype: facts\ndescription:\n  Still not a single frontmatter line.\n---\n# Indented description\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, indented), ["Set description to one non-empty line."]);
    });
    const repeated = "projects/example/notes/repeated-description.md";
    await reject([{ op: "create", path: repeated, content: "---\ntype: facts\ndescription: First sentence about the checkout.\ndescription: Second sentence about the checkout.\n---\n# Repeated description\n\nBody.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, repeated), ["Set description once."]);
    });
  });
});

test("tasks require a valid status and other types reject an invalid status", async () => {
  await withStore(async ({ edit, reject }) => {
    const missing = "projects/example/tasks/missing-status.md";
    await reject([{ op: "create", path: missing, content: doc({ type: "tasks", title: "Missing status work", description: "Accepted work that never names a status." }) }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, missing), ["Add status: todo, doing, blocked, or done."]);
    });
    for (const status of ["complete", "Done", "later"]) {
      const target = `projects/example/tasks/bad-${status.toLowerCase()}.md`;
      await reject([{ op: "create", path: target, content: doc({ type: "tasks", status, title: `${status} status work`, description: `Accepted work marked with invalid status ${status}.` }) }], "FRONTMATTER", error => {
        assert.deepEqual(problems(error, target), ["Set status to one of todo, doing, blocked, done."]);
      });
    }
    const repeated = "projects/example/tasks/repeated-status.md";
    await reject([{ op: "create", path: repeated, content: "---\ntype: tasks\ndescription: Accepted work with two status keys.\nstatus: todo\nstatus: doing\n---\n# Repeated status\n\nGoal: one status.\n" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, repeated), ["Set status once."]);
    });
    const facts = "projects/example/notes/bad-facts-status.md";
    await reject([{ op: "create", path: facts, content: doc({ status: "nope", title: "Facts with a bad status", description: "A fact that carries a status token that is not allowed." }) }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, facts), ["Set status to one of todo, doing, blocked, done."]);
    });
    for (const status of ["todo", "doing", "blocked", "done"]) {
      await edit([{ op: "create", path: `projects/example/tasks/${status}-work.md`, content: doc({ type: "tasks", status, title: `${status} work item`, description: `Accepted work currently marked ${status} for the example project.` }) }]);
    }
    await edit([{ op: "create", path: "projects/example/notes/facts-with-todo.md", content: doc({ status: "todo", title: "Fact that also tracks todo", description: "A fact may carry a valid status without becoming a task." }) }]);
  });
});

test("every non-task type can be created and a description may contain a colon", async () => {
  await withStore(async ({ edit, text }) => {
    for (const type of ["facts", "decisions", "runbooks", "log"]) {
      const target = `projects/example/notes/${type}-note.md`;
      const saved = await edit([{ op: "create", path: target, content: doc({ type, title: `${type} owner note`, description: `This ${type} document explains one durable constraint.` }) }]);
      assert.equal(saved.applied, true);
      assert.match(text(target), new RegExp(`type: ${type}`));
    }
    const colon = "projects/example/notes/colon-description.md";
    await edit([{ op: "create", path: colon, content: "---\ntype: runbooks\ndescription: Use spec_edit: it checks the type.\n---\n# Colon description\n\nRun the edit.\n" }]);
    assert.match(text(colon), /description: Use spec_edit: it checks the type\./);
  });
});

test("quoted frontmatter, comments, CRLF, sources, and a legacy gei line stay writable", async () => {
  await withStore(async ({ edit, text }) => {
    const quoted = "projects/example/notes/quoted-fields.md";
    await edit([{ op: "create", path: quoted, content: "---\n# kind\ntype: \"facts\"\ndescription: \"Quoted fact about checkout layout\"\n---\n# Quoted fields\n\nBody.\n" }]);
    assert.match(text(quoted), /type: "facts"/);
    const crlf = "projects/example/notes/crlf-note.md";
    await edit([{ op: "create", path: crlf, content: doc({ title: "CRLF note title", description: "A CRLF note keeps its type and description." }).replaceAll("\n", "\r\n") }]);
    assert.match(text(crlf), /type: facts/);
    assert.match(text(crlf), /description: A CRLF note keeps its type and description\./);
    const sourced = "projects/example/notes/sourced-note.md";
    const content = "---\ntype: facts\ndescription: Source list stays readable beside the new fields.\ngei: {\"sources\":{\"src/hidden.js\":\"0123456789abcdef\"}}\nsources:\n  - src/lib.js\n  - \"src/other.js\"\n---\n# Sourced note\n\nBody.\n";
    await edit([{ op: "create", path: sourced, content }]);
    assert.deepEqual(SourceDrift.list(text(sourced)), ["src/lib.js", "src/other.js"]);
    assert.match(text(sourced), /gei:/);
  });
});

test("replace and replace_lines rewrite frontmatter from line 1", async () => {
  await withStore(async ({ edit, text, store }) => {
    const target = "projects/example/notes/rewritten-note.md";
    await edit([{ op: "create", path: target, content: doc({ title: "Rewritten note title", description: "Original description before the field edit." }) }]);
    await edit([{ op: "replace", path: target, old_text: "type: facts", new_text: "type: decisions" }]);
    await edit([{ op: "replace", path: target, old_text: "description: Original description before the field edit.", new_text: "description: Replacement description after a normal edit." }]);
    assert.match(text(target), /type: decisions/);
    assert.match(text(target), /description: Replacement description after a normal edit\./);
    const searched = await callTool(store, "spec_search", { query: "replacement description after a normal edit", path_prefix: "projects/example/" });
    assert.equal(searched.results[0].path, target);
    await edit([{
      op: "replace_lines", path: target, start_line: 1, end_line: 4,
      new_text: "---\ntype: log\ndescription: Rewritten from the first physical line.\n---",
    }]);
    assert.match(text(target), /type: log/);
    assert.match(text(target), /description: Rewritten from the first physical line\./);
    assert.match(text(target), /Rewritten note title/);
  });
});

test("an edit that drops type, description, or task status is rejected and does not write", async () => {
  await withStore(async ({ edit, reject, text }) => {
    const note = "projects/example/notes/guarded-note.md";
    const original = doc({ title: "Guarded note title", description: "Guarded description that must survive a bad edit." });
    await edit([{ op: "create", path: note, content: original }]);
    await reject([{ op: "replace", path: note, old_text: "type: facts\n", new_text: "" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, note), ["Add type: facts, decisions, runbooks, log, or tasks."]);
    });
    assert.equal(text(note), original);
    await reject([{ op: "replace", path: note, old_text: "description: Guarded description that must survive a bad edit.\n", new_text: "" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, note), ["Add a one-line description."]);
    });
    assert.equal(text(note), original);
    await reject([{ op: "replace", path: note, old_text: "type: facts", new_text: "type: tasks" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, note), ["Add status: todo, doing, blocked, or done."]);
    });
    assert.equal(text(note), original);
    const task = "projects/example/tasks/guarded-task.md";
    const taskBody = doc({ type: "tasks", status: "todo", title: "Guarded task title", description: "Guarded task description that must keep its status." });
    await edit([{ op: "create", path: task, content: taskBody }]);
    await reject([{ op: "replace", path: task, old_text: "status: todo\n", new_text: "" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, task), ["Add status: todo, doing, blocked, or done."]);
    });
    assert.equal(text(task), taskBody);
    await edit([{ op: "replace", path: task, old_text: "type: tasks\n", new_text: "type: log\n" }, { op: "replace", path: task, old_text: "status: todo\n", new_text: "" }]);
    assert.match(text(task), /type: log/);
    assert.doesNotMatch(text(task), /status:/);
  });
});

test("a legacy document can gain frontmatter, and a body edit or rename without it is rejected", async () => {
  await withStore(async ({ write, edit, reject, text, home }) => {
    const legacy = "projects/example/notes/legacy-note.md";
    const original = "# Legacy title\n\nLegacy body stays here.\n";
    await write(legacy, original);
    await reject([{ op: "replace", path: legacy, old_text: "Legacy body", new_text: "Legacy body updated" }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, legacy), ["Add YAML frontmatter with type (facts, decisions, runbooks, log, or tasks) and a one-line description."]);
    });
    assert.equal(text(legacy), original);
    const moved = "projects/example/notes/renamed-legacy.md";
    await reject([{ op: "rename", path: legacy, to: moved }], "FRONTMATTER", error => {
      assert.deepEqual(problems(error, moved), ["Add YAML frontmatter with type (facts, decisions, runbooks, log, or tasks) and a one-line description."]);
    });
    assert.equal(fs.existsSync(path.join(home, legacy)), true);
    assert.equal(fs.existsSync(path.join(home, moved)), false);
    await edit([{ op: "replace", path: legacy, old_text: "# Legacy title", new_text: "---\ntype: facts\ndescription: Legacy note gained a description.\n---\n# Legacy title" }]);
    assert.match(text(legacy), /type: facts/);
    assert.match(text(legacy), /Legacy body stays here\./);
    await edit([{ op: "delete", path: legacy }]);
    assert.equal(fs.existsSync(path.join(home, legacy)), false);
    await write("projects/example/notes/plain-legacy.md", "# Plain legacy\n\nDelete me without frontmatter.\n");
    await edit([{ op: "delete", path: "projects/example/notes/plain-legacy.md" }]);
    assert.equal(fs.existsSync(path.join(home, "projects/example/notes/plain-legacy.md")), false);
  });
});

test("INDEX.md files do not require type, description, or status", async () => {
  await withStore(async ({ edit, text }) => {
    await edit([{ op: "create", path: "projects/example/INDEX.md", content: "# Example\n\nRoutes for the example project.\n" }]);
    await edit([{ op: "replace", path: "projects/example/INDEX.md", old_text: "Routes for the example project.", new_text: "Routes for the example project after an edit." }]);
    await edit([{ op: "create", path: "projects/example/notes/INDEX.md", content: "---\ntype: bogus\n---\n# Nested index\n\nStill exempt.\n" }]);
    await edit([{ op: "create", path: "context/INDEX.md", content: "# Shared\n\nShared routes.\n" }]);
    assert.match(text("projects/example/INDEX.md"), /after an edit/);
    assert.match(text("projects/example/notes/INDEX.md"), /type: bogus/);
    assert.match(text("context/INDEX.md"), /Shared routes/);
  });
});

test("a rejected batch writes none of its creates", async () => {
  await withStore(async ({ reject, home }) => {
    const first = "projects/example/notes/aa-missing.md";
    const second = "projects/example/notes/bb-missing.md";
    await reject([
      { op: "create", path: first, content: "# AA missing frontmatter\n\nBody.\n" },
      { op: "create", path: second, content: "# BB missing frontmatter\n\nBody.\n" },
    ], "FRONTMATTER", error => {
      assert.deepEqual(error.details.documents.map(item => item.path), [first, second]);
    });
    assert.equal(fs.existsSync(path.join(home, first)), false);
    assert.equal(fs.existsSync(path.join(home, second)), false);
  });
});

test("create rejects a duplicate description, title, path, or path stem", async () => {
  await withStore(async ({ write, edit, reject, home }) => {
    const keeper = "projects/example/notes/keeper-note.md";
    await write(keeper, doc({ title: "Checkout source drift", description: "Checkout Layout Matters Here", body: "Keeper body.\n" }));
    const described = "projects/example/notes/same-description.md";
    await reject([{ op: "create", path: described, content: doc({ title: "Different note title", description: "checkout layout matters here" }) }], "DUPLICATE", error => {
      assert.equal(error.details.edit_index, 0);
      assert.deepEqual(error.details.existing_paths, [keeper]);
      assert.deepEqual(error.details.matches, [{ path: keeper, via: ["description"] }]);
    });
    assert.equal(fs.existsSync(path.join(home, described)), false);
    await reject([{ op: "create", path: "projects/example/notes/spaced-description.md", content: doc({ title: "Spaced description title", description: "Checkout  layout matters here" }) }], "DUPLICATE", error => {
      assert.deepEqual(error.details.existing_paths, [keeper]);
    });
    const titled = "projects/example/notes/same-title.md";
    await reject([{ op: "create", path: titled, content: doc({ title: "Checkout source drift", description: "A different sentence about owner handoff rules." }) }], "DUPLICATE", error => {
      assert.ok(error.details.matches[0].via.includes("title"));
    });
    const crossed = "projects/example/notes/crossed-name.md";
    await reject([{ op: "create", path: crossed, content: doc({ title: "Checkout Layout Matters Here", description: "A separate sentence about storage layout today." }) }], "DUPLICATE", error => {
      assert.ok(error.details.matches[0].via.includes("title-description"));
    });
    await write("projects/example/notes/memory-redesign.md", doc({ title: "Notes", description: "Alpha storage layout for the checkout.", body: "Layout.\n" }));
    await reject([{ op: "create", path: "projects/example/topics/memory-redesign.md", content: doc({ title: "Extra", description: "Beta storage layout for the checkout." }) }], "DUPLICATE", error => {
      assert.deepEqual(error.details.matches[0].via, ["path"]);
    });
    await reject([{ op: "create", path: "projects/example/notes/memory-redesign-2026.md", content: doc({ title: "Year", description: "Gamma storage layout for the checkout." }) }], "DUPLICATE", error => {
      assert.deepEqual(error.details.matches[0].via, ["path"]);
    });
    await reject([{ op: "create", path: "projects/example/notes/other-topic.md", content: doc({ title: "memory redesign", description: "A distinct sentence about owner handoff rules." }) }], "DUPLICATE", error => {
      assert.ok(error.details.matches.some(item => item.via.includes("path-title")));
    });
  });
});

test("create returns every matching path and ignores short or cross-project overlap", async () => {
  await withStore(async ({ write, edit, reject, text }) => {
    await write("projects/example/notes/a-keeper.md", doc({ title: "Shared checkout title", description: "How the alpha service restarts after a deploy.", body: "Alpha.\n" }));
    await write("projects/example/notes/b-keeper.md", doc({ title: "Shared checkout title", description: "Where beta logs are shipped from the hosts.", body: "Beta.\n" }));
    await reject([{ op: "create", path: "projects/example/notes/c-fresh.md", content: doc({ title: "Shared checkout title", description: "Why gamma keeps a local cache for reads." }) }], "DUPLICATE", error => {
      assert.deepEqual(error.details.existing_paths, ["projects/example/notes/a-keeper.md", "projects/example/notes/b-keeper.md"]);
    });
    const first = "projects/example/notes/first-record.md";
    const second = "projects/example/notes/second-record.md";
    await reject([
      { op: "create", path: first, content: doc({ title: "First record title", description: "Same description for both new records in this batch." }) },
      { op: "create", path: second, content: doc({ title: "Second record title", description: "Same description for both new records in this batch." }) },
    ], "DUPLICATE", error => {
      assert.deepEqual(error.details.existing_paths, [first]);
      assert.equal(error.details.edit_index, 1);
    });
    await edit([{ op: "create", path: "projects/example/notes/edit-facts.md", content: doc({ title: "Edit facts", description: "The store records facts about edits in the project." }) }]);
    await edit([{ op: "create", path: "projects/example/notes/read-facts.md", content: doc({ title: "Read facts", description: "The store records facts about reads in the project." }) }]);
    await edit([{ op: "create", path: "projects/example/topics/alpha/README.md", content: doc({ title: "Alpha domain terms", description: "Terms owned by the alpha topic." }) }]);
    await edit([{ op: "create", path: "projects/example/topics/beta/README.md", content: doc({ title: "Beta domain terms", description: "Terms owned by the beta topic." }) }]);
    await edit([{ op: "create", path: "projects/example/notes/api.md", content: doc({ title: "Alpha", description: "Short path stem alpha does not collide." }) }]);
    await edit([{ op: "create", path: "projects/example/topics/api.md", content: doc({ title: "Beta", description: "Short path stem beta does not collide." }) }]);
    await write("projects/other/notes/keeper.md", doc({ title: "Foreign project title", description: "A sentence that also exists in another project.", body: "Other.\n" }));
    const foreign = await edit([{ op: "create", path: "projects/example/notes/same-as-other.md", content: doc({ title: "Foreign project title", description: "A sentence that also exists in another project." }) }]);
    assert.equal(foreign.applied, true);
    await write("projects/example/notes/memory-redesign.md", doc({ title: "Storage layout", description: "How files are laid out on disk for this checkout.", body: "Layout.\n" }));
    const mentioned = await edit([{ op: "create", path: "projects/example/notes/schedule-note.md", content: doc({ title: "Scheduling notes", description: "Notes about the memory redesign schedule and owners." }) }]);
    assert.equal(mentioned.applied, true);
    assert.match(text("projects/example/notes/schedule-note.md"), /memory redesign schedule/);
    await edit([{ op: "replace", path: "projects/example/notes/read-facts.md", old_text: "description: The store records facts about reads in the project.", new_text: "description: The store records facts about edits in the project." }]);
    assert.match(text("projects/example/notes/read-facts.md"), /facts about edits/);
  });
});

test("delete then create can replace a document, and context is a separate scope", async () => {
  await withStore(async ({ write, edit, reject }) => {
    const oldPath = "projects/example/notes/retiring-note.md";
    const content = doc({ title: "Retiring note title", description: "This note moves to a new path in one batch." });
    await write(oldPath, content);
    const moved = await edit([
      { op: "delete", path: oldPath },
      { op: "create", path: "projects/example/notes/replaced-note.md", content },
    ]);
    assert.equal(moved.applied, true);
    await write("projects/example/notes/project-only.md", doc({ title: "Project only title", description: "Shared wording that context may repeat." }));
    const shared = await edit([{ op: "create", path: "context/notes/repeated.md", content: doc({ title: "Project only title", description: "Shared wording that context may repeat." }) }]);
    assert.equal(shared.applied, true);
    await reject([{ op: "create", path: "context/notes/again.md", content: doc({ title: "Another context title", description: "Shared wording that context may repeat." }) }], "DUPLICATE", error => {
      assert.deepEqual(error.details.existing_paths, ["context/notes/repeated.md"]);
    });
  });
});

test("a fenced heading is not the title used for duplicate detection", async () => {
  await withStore(async ({ write, edit }) => {
    await write("projects/example/notes/real-title.md", doc({ title: "Real checkout title", description: "The existing note owns this title only.", body: "Existing.\n" }));
    const created = await edit([{ op: "create", path: "projects/example/notes/fenced-title.md", content: [
      "---",
      "type: facts",
      "description: A fenced copy of another title is not this note.",
      "---",
      "```",
      "# Real checkout title",
      "```",
      "# Actual unique title",
      "",
      "The real heading follows the fence.",
      "",
    ].join("\n") }]);
    assert.equal(created.applied, true);
  });
});

test("rename of a valid document succeeds", async () => {
  await withStore(async ({ edit, home }) => {
    const source = "projects/example/notes/alpha-record.md";
    const target = "projects/example/notes/alpha-moved.md";
    await edit([{ op: "create", path: source, content: doc({ title: "Alpha record title", description: "Alpha record description for the move." }) }]);
    await edit([{ op: "rename", path: source, to: target }]);
    assert.equal(fs.existsSync(path.join(home, source)), false);
    assert.match(fs.readFileSync(path.join(home, target), "utf8"), /type: facts/);
  });
});

function git(cwd, args) {
  execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "user.name=Gei Test", "-c", "user.email=gei@example.com", ...args], {
    cwd,
    env: { ...process.env, GIT_AUTHOR_NAME: "Gei Test", GIT_AUTHOR_EMAIL: "gei@example.com", GIT_COMMITTER_NAME: "Gei Test", GIT_COMMITTER_EMAIL: "gei@example.com" },
    stdio: "pipe",
  });
}

class McpClient {
  constructor(env) {
    this.stderr = "";
    this.buffer = "";
    this.waiters = [];
    this.id = 0;
    this.child = spawn(process.execPath, [path.join(repoRoot, "skills/memo/scripts/spec/mcp.mjs")], { cwd: repoRoot, env, stdio: ["pipe", "pipe", "pipe"] });
    this.child.stdout.on("data", chunk => {
      this.buffer += chunk;
      let newline = this.buffer.indexOf("\n");
      while (newline >= 0) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        newline = this.buffer.indexOf("\n");
        if (!line.trim()) continue;
        const waiter = this.waiters.shift();
        if (waiter) waiter(JSON.parse(line));
      }
    });
    this.child.stderr.on("data", chunk => { this.stderr += chunk; });
  }
  request(method, params) {
    const id = ++this.id;
    return new Promise((resolve, rejectPromise) => {
      const timer = setTimeout(() => rejectPromise(new Error(`timeout ${method}\n${this.stderr}`)), 20000);
      this.waiters.push(message => {
        clearTimeout(timer);
        if (message.id !== id) rejectPromise(new Error(`response id ${message.id} for ${id}: ${JSON.stringify(message)}`));
        else resolve(message);
      });
      this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }
  async call(name, args) {
    const message = await this.request("tools/call", { name, arguments: args });
    return message.result;
  }
  async close() {
    this.child.stdin.end();
    await new Promise(resolve => {
      const timer = setTimeout(() => { this.child.kill(); resolve(); }, 2000);
      this.child.on("close", () => { clearTimeout(timer); resolve(); });
    });
  }
}

test("MCP session against a temp git repo rejects bad frontmatter and a duplicate create", { timeout: 30000 }, async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "gei-edit-mcp-"));
  const home = path.join(parent, "knowledge");
  const state = path.join(parent, "state");
  fs.mkdirSync(home);
  git(home, ["init", "-b", "main"]);
  const keeper = "projects/example/notes/keeper.md";
  const keeperBody = doc({ title: "Keeper checkout title", description: "Keeper description for the end to end session.", body: "KeeperMarker stays in git.\n" });
  fs.mkdirSync(path.dirname(path.join(home, keeper)), { recursive: true });
  fs.writeFileSync(path.join(home, "projects/example/INDEX.md"), "# Example\n\nIndexMarker routes the example project.\n");
  fs.writeFileSync(path.join(home, keeper), keeperBody);
  git(home, ["add", "-A"]);
  git(home, ["commit", "-m", "initial knowledge"]);
  const client = new McpClient({ ...process.env, GEI_SPEC_HOME: home, GEI_SPEC_STATE: state });
  const log = {};
  try {
    const initialized = await client.request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "gei-edit", version: "0" } });
    assert.equal(initialized.result.serverInfo.name, "gei-spec");
    const read = await client.call("spec_read", { paths: ["projects/example/INDEX.md", keeper] });
    assert.equal(read.isError, undefined);
    const revision = read.structuredContent.revision;
    const missing = await client.call("spec_edit", {
      base_revision: revision, summary: "Reject a note without frontmatter",
      edits: [{ op: "create", path: "projects/example/notes/missing.md", content: "# Missing frontmatter\n\nNo fields.\n" }],
    });
    log.missing_frontmatter = missing.structuredContent;
    assert.equal(missing.isError, true);
    assert.equal(missing.structuredContent.code, "FRONTMATTER");
    const tasks = await client.call("spec_edit", {
      base_revision: revision, summary: "Reject a task without status",
      edits: [{ op: "create", path: "projects/example/tasks/open.md", content: doc({ type: "tasks", title: "Open task title", description: "Accepted work with no status field yet." }) }],
    });
    log.missing_status = tasks.structuredContent;
    assert.equal(tasks.structuredContent.code, "FRONTMATTER");
    const duplicate = await client.call("spec_edit", {
      base_revision: revision, summary: "Reject a duplicate note",
      edits: [{ op: "create", path: "projects/example/notes/copy.md", content: doc({ title: "Copy note title", description: "Keeper description for the end to end session." }) }],
    });
    log.duplicate = duplicate.structuredContent;
    assert.equal(duplicate.structuredContent.code, "DUPLICATE");
    assert.deepEqual(duplicate.structuredContent.existing_paths, [keeper]);
    const created = await client.call("spec_edit", {
      base_revision: revision, summary: "Create a fact and edit the index",
      edits: [
        { op: "replace", path: "projects/example/INDEX.md", old_text: "IndexMarker", new_text: "IndexMarkerUpdated" },
        { op: "create", path: "projects/example/notes/created.md", content: doc({ title: "Created note title", description: "Created description written through MCP.", body: "CreatedMarker is the new body.\n" }) },
      ],
    });
    log.created = created.structuredContent;
    assert.equal(created.isError, undefined);
    assert.equal(created.structuredContent.applied, true);
    const rewritten = await client.call("spec_edit", {
      base_revision: created.structuredContent.revision, summary: "Rewrite frontmatter from line 1",
      edits: [{ op: "replace_lines", path: "projects/example/notes/created.md", start_line: 1, end_line: 4, new_text: "---\ntype: decisions\ndescription: Rewritten description written through MCP.\n---" }],
    });
    log.rewritten = rewritten.structuredContent;
    assert.equal(rewritten.structuredContent.applied, true);
    const after = await client.call("spec_read", { paths: ["projects/example/notes/created.md", "projects/example/INDEX.md"], revision: rewritten.structuredContent.revision });
    const files = Object.fromEntries(after.structuredContent.files.map(file => [file.path, file.content]));
    assert.match(files["projects/example/notes/created.md"], /type: decisions/);
    assert.match(files["projects/example/notes/created.md"], /Rewritten description written through MCP/);
    assert.match(files["projects/example/notes/created.md"], /CreatedMarker/);
    assert.match(files["projects/example/INDEX.md"], /IndexMarkerUpdated/);
    const searched = await client.call("spec_search", { query: "rewritten description written through mcp", path_prefix: "projects/example/", revision: rewritten.structuredContent.revision });
    log.search = searched.structuredContent.results.map(item => ({ path: item.path, line: item.line }));
    assert.equal(searched.structuredContent.results[0].path, "projects/example/notes/created.md");
    const status = execFileSync("git", ["-C", home, "status", "--short"], { encoding: "utf8" });
    log.git_status = status.trim().split("\n");
    assert.match(status, /projects\/example\/notes\/created\.md/);
    assert.equal(fs.existsSync(path.join(home, "projects/example/notes/missing.md")), false);
    assert.equal(fs.existsSync(path.join(home, "projects/example/notes/copy.md")), false);
    console.log(`E2E_MCP ${JSON.stringify(log, null, 2)}`);
  } finally {
    await client.close();
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
