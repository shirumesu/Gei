#!/usr/bin/env node
// PostToolUse on the memo `brief` and `find` tools: record which entries the session was shown,
// read from the result text itself, so the Stop hook can count the citations against them.
// Failed calls go to PostToolUseFailure, which is not hooked: they showed nothing.
import { hook, sessionId, sessionProject } from "./lib.mjs";

// Claude Code passes an MCP result as its content array; Codex as the result object.
function resultText(response) {
  const content = Array.isArray(response) ? response : response?.content;
  if (!Array.isArray(content)) throw new Error(`Unexpected tool_response for an MCP tool: ${JSON.stringify(response).slice(0, 200)}`);
  return content.filter(block => block.type === "text").map(block => block.text).join("\n");
}

await hook("PostToolUse", async input => {
  const tool = /__(brief|find)$/u.exec(input.tool_name)?.[1];
  if (!tool) throw new Error(`The memo PostToolUse hook matched ${input.tool_name}, which is neither brief nor find.`);
  const session = sessionId(input);
  const { record } = await import("../skills/memo/scripts/read.mjs");
  const { queryWords } = await import("../skills/memo/scripts/rank.mjs");
  const project = await sessionProject(session, input.cwd);
  record({ session, project, via: tool === "brief" ? "start" : "find", query: tool === "brief" ? null : queryWords(input.tool_input.words.join(" ")).join(" "), text: resultText(input.tool_response) });
  return {};
});
