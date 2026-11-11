# Memo eval scores

One row per plugin version. Each cell is the family's mean case score with the plugin, then without it (no memory). The primary metric is task success; steps and tokens are cost only. Release gate: in every D case the with-plugin score is not below the without-plugin score.

Run from the repository root (each run is a real model call on your account):

```bash
claude plugin eval . --scaffold --trust-plugin --no-publish --model claude-sonnet-5-5 -j 4 --allow-tools Write Edit
```

Version 0.15.1 also needed `--allow-real-servers --allow-tools "mcp__plugin_gei_spec__*"` for its MCP server.

| Version | Date | Model | Runs | A write | B read | C reuse | D no harm | E growth | D gate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
