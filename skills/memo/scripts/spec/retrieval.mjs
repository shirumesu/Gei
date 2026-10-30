export function windowBytes(text, start_line, start_column, max_lines, line_numbers) {
  return Buffer.byteLength(text.split("\n").slice(start_line - 1, start_line - 1 + max_lines).map((line, index) => {
    const segment = index === 0 ? Array.from(line).slice(start_column - 1).join("") : line;
    return line_numbers ? `${start_line + index}: ${segment}` : segment;
  }).join("\n"));
}

export function sharedBudgets(needs, total = 48000) {
  const budgets = needs.map(() => 0);
  const pending = needs.map((bytes, index) => ({ bytes, index })).sort((a, b) => a.bytes - b.bytes || a.index - b.index);
  for (const [position, item] of pending.entries()) {
    const budget = Math.min(item.bytes, Math.floor(total / (pending.length - position)));
    budgets[item.index] = budget;
    total -= budget;
  }
  return budgets;
}

export function readWindow(text, { start_line, start_column, max_lines, line_numbers }, budget) {
  const lines = text.split("\n"), selected = [];
  let nextLine = start_line, nextColumn = start_column, remaining = budget;
  for (let index = start_line - 1; index < Math.min(lines.length, start_line - 1 + max_lines); index++) {
    const chars = Array.from(lines[index]);
    const offset = index === start_line - 1 ? start_column - 1 : 0;
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
  return { content: selected.join("\n"), start_line, total_lines: lines.length,
    ...(line_numbers ? { line_numbers: true } : {}), start_column, truncated,
    next_line: truncated ? nextLine : undefined, next_column: truncated ? nextColumn : undefined };
}
