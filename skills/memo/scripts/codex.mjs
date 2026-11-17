// Codex runs the memo MCP server from ~/.codex/config.toml, not from the plugin: a Codex plugin's
// MCP config cannot name a file inside the plugin (no path variable is expanded and the server
// starts in the session's directory). `gei memo setup` writes a small launcher at a fixed path and
// registers it; the launcher loads the server from the plugin directory named in a pointer file,
// which setup writes and the SessionStart hook rewrites in every Codex session, so a plugin update
// is picked up by the session after it.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stateDir } from "./store.mjs";

export const SERVER_NAME = "gei_memo";
export const launcherFile = () => path.join(stateDir(), "codex-mcp.mjs");
export const pointerFile = () => path.join(stateDir(), "codex-plugin-root");
export const configFile = () => path.join(os.homedir(), ".codex", "config.toml");

export const LAUNCHER = `// Written by \`gei memo setup\`: Codex starts the Gei memo MCP server through this file.
// codex-plugin-root, beside it, names the installed plugin; the SessionStart hook keeps it current.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const pointer = path.join(path.dirname(fileURLToPath(import.meta.url)), "codex-plugin-root");
const server = path.join(fs.readFileSync(pointer, "utf8").trim(), "skills", "memo", "scripts", "mcp.mjs");
if (!fs.existsSync(server)) throw new Error(\`\${server} does not exist (the plugin was updated or removed). Start a new session: its SessionStart hook updates \${pointer}.\`);
await import(pathToFileURL(server).href);
`;

export function writePointer(pluginRoot) {
  fs.mkdirSync(stateDir(), { recursive: true });
  if (fs.existsSync(pointerFile()) && fs.readFileSync(pointerFile(), "utf8").trim() === pluginRoot) return;
  fs.writeFileSync(pointerFile(), `${pluginRoot}\n`);
}

// The TOML table setup adds; JSON strings are valid TOML basic strings.
export const configBlock = () => `[mcp_servers.${SERVER_NAME}]\ncommand = "node"\nargs = [${JSON.stringify(launcherFile())}]\n`;

// The [mcp_servers.gei_memo] table as it stands in config.toml (up to the next table), or null.
export function currentBlock(text) {
  const lines = text.split("\n");
  const start = lines.findIndex(line => line.trim() === `[mcp_servers.${SERVER_NAME}]`);
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && /^\s*\[/u.test(line));
  return `${lines.slice(start, end === -1 ? lines.length : end).join("\n").trim()}\n`;
}
