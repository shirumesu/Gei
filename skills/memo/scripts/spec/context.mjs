// What one SessionStart hook injects: a header plus one document, or nothing when the document is empty.
// Claude Code moves hook text over 10,000 characters to a file and shows a 2,000-character preview;
// Codex hooks raise their spill limit (additionalContextLimit) above that. Over the budget, the text is
// cut at a line here and says so, instead of the host cutting it silently.
export const HOOK_CHARS = 9500;

export function hookContext(header, name, text) {
  const body = String(text || "").trim();
  if (!body) return "";
  const full = `${header}\n\n${body}`;
  if (full.length <= HOOK_CHARS) return full;
  const notice = `\n\n⚠️ ${name} is ${body.length} characters and was cut at the hook limit. Read the rest with spec_read, then shorten ${name}.`;
  const kept = full.slice(0, HOOK_CHARS - notice.length);
  return kept.slice(0, Math.max(kept.lastIndexOf("\n"), header.length)) + notice;
}
