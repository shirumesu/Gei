# Memo eval scores

One row per plugin version. Each cell is the family's mean case score with the plugin, then without it (no memory). The primary metric is task success; steps and tokens are cost only. Release gate: in every D case the with-plugin score is not below the without-plugin score.

Run from the repository root (each run is a real model call on your account):

```bash
claude plugin eval . --scaffold --trust-plugin --no-publish --model claude-sonnet-5-5 -j 4 --allow-tools Write Edit
```

Grant the store as user settings would (runs have none): `--allow-tools Write Edit "Read(~/.agents/geispec/**)" "Edit(~/.agents/geispec/**)"`; writes outside the workspace are denied otherwise. Version 0.15.1 needed `--allow-real-servers --allow-tools Write Edit "mcp__plugin_gei_spec__*"` instead. The E family runs separately: `node evals/e-growth/drive.mjs`.

| Version | Date | Model | Runs | A write | B read | C reuse | D no harm | E growth | D gate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.15.1 | 2026-11-11 | claude-sonnet-5-5 | 3 | 0.94 (0.72) | 1.00 (0.35) | — | — | — | — | Re-run with the final A/B graders. A1: the implicit pnpm correction reached memory in 1 of 3 runs. C–E need the new store and were not run. $1.70. |
| 0.16.0 | 2026-11-11 | claude-sonnet-5-5 | 3 | 1.00 (0.72) | 1.00 (0.31) | 1.00 (0.78) | 1.00 (1.00) | 10 sessions: 3 topic files, 1 pointer, 0 near-duplicates, 1,455 injected chars; read and reuse checks on the grown store pass | Pass | C1/C2: no-memory runs also found the helpers (no margin). D1: the dead pointer was never fixed (with-only indicator 0/3). E: the s08 pitfall (generated users.json) was not recorded; E's one lint problem is the pointer checked against an empty measuring workspace. $3.47 + $0.53. |
