# Changelog

This file records public release notes for Gei.

## v0.4.0 - 2026-5-17

### 新增
- 添加 marketplace 安装方式，完全支持 Codex plugin 形式
- 新增 GitHub workflow，在 `CHANGELOG.md` 发布版本后自动同步 `.codex-plugin/plugin.json` 的 `version`

### 优化
- `using-gei`修改为 Hook，自动在会话开始时进入上下文
- `using-gei`的 current-work 任务拆分为 `references/current-work.md`
- `memo`部分文件存在旧版本残留，已清除
- `see` 和 `work` 压缩部分内容；更新 description 为更适合 Agent 阅读的形式

## v0.3.2 - 2026-5-14

### 新增
- `AGENTS.md`：给出示例 `AGENTS.md`

### 优化
- `consider`：增强思考强度，新增输出前的自我审查。而不只是提供即刻想出的方案
- `memo`: 重新安排 spec-plan 结构，提供明确的实现细节，具体代码，验证行为，不再以冗长的section/phase/task三部分区分，合并为 section

## v0.3.1 - 2026-5-9

### 新功能
- `memo` 移除默认待办 / 记忆文档体系，改为围绕 `current-work`、`CHANGELOG`、`ARCHITECTURE` 和显式 task spec 工作。
- `CHANGELOG` 支持 `Unreleased`、版本发布和无固定版本项目的 checkpoint 整理。

### 优化
- `work` 关闭有文件更改的任务时，会通过 `memo` 将更改写入 `CHANGELOG.md#Unreleased`。
- `consider` 读取 spec 时不再默认读取待办 / 记忆文档，只按需读取 `current-work` 和 `CHANGELOG`。
- `using-gei`、`work`、`memo` 的路由说明同步为新的精简 spec 模型。

### 清理
- 删除 Memo 中待办 / 记忆文档的事件、契约、模板和初始化输出。
- 同步 Gei 自身 `spec/`，移除旧待办 / 记忆文档。

## v0.3.0 - 2026-5-9

### 新功能
- `memo`、`work`、`consider`任务体系现在由`using-gei`统一管理
- 新增轻量无文档任务记录`spec/current-work.md`
- 增强`consider`描述，现在对模糊点提问了
- `memo`新增 `OVERVIEW.md`，强化文档对系统上下文的记录能力。

## v0.2.5 - 2026-5-9

### 优化
- 减轻 `memo` 体量，压缩和下沉重复内容

## v0.2.4 - 2026-4-30

### 新功能

- 打包为 codex plugin 样式

### 修复

- 优化安装说明

## v0.2.3 - 2026-4-27

### Features

- 修改CI
- consider增加提问与拆分

### Fixes

- memo更好的自行调用 & git排除

## v0.2.2 - 2026-04-25

### Changed

- Refactored `Work\script\ship_scan` into a more maintainable structure, improved performance, reduced false positives, fixed display issues, and added `skills/work/scripts/README.md`.

### Fixed

- Updated `using-gei` so its description makes it clearer that it must be loaded before other Gei skills.

## v0.2.1 - 2026-04-23

### Changed

- Refined `consider` so it stops more clearly at the design stage before implementation.
- Split `memo` into event references and document contracts so the entry file only routes the current event.

### Fixed

- Improved `using-gei` routing so it distinguishes the user's final goal from supporting actions.
- Restored `see` in the full installation example.
- Updated `work` so spec document ownership stays with `memo`.

### Docs

- Added `consider/references/read-spec.md`.
- Completed the `v0.2.1` release notes.

## v0.2.0 - 2026-04-23

### Added

- Added `using-gei` as the top-level router for `design`, `consider`, `memo`, and `work`.
- Added `see` for comparison, fact-checking, topic exploration, how-to research, public-opinion sampling, and multi-source summaries.
- Added `see` tool guidance and a local health check script.
- Added an explicit archive path to `memo`.

### Changed

- Renamed `kickoff` to `consider`.
- Changed `work` into a router with separate lightweight and spec-driven execution flows.

### Fixed

- Fixed `memo` writing behavior for work files.
- Reduced false positives in the `work` ship check.

### Docs

- Updated installation guidance for `using-gei` and selective skill installation.

## v0.1.0 - 2026-04-21

### Added

- Published the first public release with `consider`, `memo`, `work`, and `design`.
- Added fetchable installation documentation at `docs/install.md`.
- Added tag-triggered GitHub Release packaging for `Gei.zip`.

### Docs

- Fixed the install entry to use the real remote `main` branch.

## v0.0.3 - 2026-04-21

### Added

- Added the tag-triggered GitHub Release workflow.
- Added `docs/install.md`.

### Docs

- Completed README installation guidance for installing multiple skills.

## v0.0.2 - 2026-04-21

### Added

- Added the `work` skill with execution, review, and ship gates.

## v0.0.1 - 2026-04-21

### Added

- Initialized the `spec/` system.
- Added the initial `consider` and `memo` project context.
