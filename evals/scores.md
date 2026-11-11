# Memo eval scores

One row per plugin version. Each cell is the family's mean case score with the plugin, then without it (no memory). The primary metric is task success; steps and tokens are cost only. Release gate: in every D case the with-plugin score is not below the without-plugin score.

Run from the repository root (each run is a real model call on your account):

```bash
claude plugin eval . --scaffold --trust-plugin --no-publish --model claude-sonnet-5-5 -j 4 --allow-tools Write Edit
```

Version 0.15.1 also needed `--allow-real-servers --allow-tools "mcp__plugin_gei_spec__*"` for its MCP server.

| Version | Date | Model | Runs | A write | B read | C reuse | D no harm | E growth | D gate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.15.1 | 2026-11-11 | claude-sonnet-5-5 | 3 | 0.90 (0.65) | 1.00 (0.28) | — | — | — | — | A1: the implicit pnpm correction was never written to memory (0/3); all other A/B cases 3/3. Cost $1.69. |
