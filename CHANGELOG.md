# Changelog

## Unreleased

### 新增
- 新增独立 `learn` Skill，负责项目记忆的读取、应用、写入、更新、删除、压缩和安全检查。
- 新增 `stop_record_memory` Stop hook，在有 `current-work` 锚点的任务结束前要求完成 Learn 记忆检查。
- 新增独立 `code-review` Skill，用于只读审查 PR、diff、commit、working tree 和实现结果，并包含安全审查参考流程。

### 优化
- 将 `MEMORY.md` 模板压缩为纯索引，把记忆写入规则从 Memo 拆到 Learn。
- 保持 `inject_overview` 与 `inject_memory` 两个 SessionStart hook 拆分，避免单个 hook 输出过长。
- 从 `work` 中移除 code review 和子 Agent 指引，让 Work 只负责代码执行、验证和发布生命周期。
- 更新 README 与安装文档中的 Skill 列表，补齐 `learn`、`code-review` 和 `create-skill`。

## v0.4.5 - 2026-06-02

### 移除
- 移除已废弃的 spec archive-directory 存储模型，以及不再维护的 Design skill

### 修复
- SessionStart 注入拆分为 `inject_using_gei.mjs` 和 `inject_overview.mjs` 两个 hook；Claude Code 和 Codex 都注册双 hook，避免单个 hook 输出同时承载 using-gei 与 OVERVIEW 后触发 Claude Code 的大输出预览。
- 拆分后取消 Claude Code/Codex 的 OVERVIEW 注入差异；两个宿主现在都会通过 `inject_overview.mjs` 注入完整 `spec/OVERVIEW.md`。
- SessionStart hook 现在始终先注入 `using-gei` 全文，再注入 `project_has_spec: true|false`；`project_has_spec` 仅以 `spec/OVERVIEW.md` 是否存在为准，避免临时遗留的 `spec/current-work.md` 被误判为完整 spec。
- Claude Code hook 配置收敛到官方默认的 `hooks/hooks.json`，移除 `hooks/claude-hooks.json`，避免 Claude Code 同时发现两份 hook 配置后静默忽略其中一份；Codex 改用 `hooks/codex-hooks.json` 保留自身占位符。
- Claude Code plugin manifest 补齐发布元数据，并保持 `0.4.5` 版本号与 Codex plugin metadata 对齐。

### 优化
- Work 的验证规则从绝对 failing-test-first 调整为按行为风险选择命令行验证；同时明确禁止把低价值存在性、源码形状、mock-only 或 “does not throw” 测试作为主要证明。
- Memo changelog 指南移除 standalone changed-file 和 commit-list 段落，让发布记录保持更短、更聚焦。
- 压缩 `using-gei` router 文本，保留首跳路由、文件变更生命周期和 progressive disclosure 约束，同时降低每次 SessionStart 注入的上下文成本。

## v0.4.4 - 2026-06-01

### 新增
- SessionStart hook 现在会自动检测项目 `spec/OVERVIEW.md` 并注入会话上下文；Codex 注入 OVERVIEW 全文，Claude Code 因 Hook 文本限制仅注入 `using-gei` 全文以及 Flag 指针（引导读取 OVERVIEW.md）

### 优化
- Memo Skill 新增置信度分层：代码/配置/测试 > current-work（近期任务记忆）> 持久文档（OVERVIEW/ARCHITECTURE/CHANGELOG）
- Architecture 契约支持 `spec/architecture/*.md` 碎片化模型，可通过按领域拆分避免单文件过长
- Architecture 模板移除验证命令表（命令事实保留在包/配置文件中）
- Overview 模板精简，移除默认的 backend/frontend/build command 字段
- Consider 读取入口从 `ARCHITECTURE.md` 改为 `OVERVIEW.md`，调整阅读顺序与置信度层级
- Memo current-work 锚点契约：废弃 `Durable record needed`，新增 `Resume` 字段，精炼 Progress/Evidence 指引含义，添加正反示例

### 文档
- `skills/memo/SKILL.md`：新增置信度分层说明和文档长度指南优化
- `skills/consider/references/read-spec.md`：全面重构，入口改为 OVERVIEW.md
- `skills/memo/references/contracts/architecture.md` / `overview.md` / `spec-system.md`：同步碎片化模型和阅读顺序
- `skills/memo/references/contracts/work-anchor.md`：契约重构（Resume、Progress、Evidence）
- `hooks/session-start.mjs`：添加项目 spec 探测和运行时感知注入逻辑

## v0.4.3 - 2026-05-29

### 新增
- `work` 新增 `testcraft.md` 测试编写参考文档，位于 `skills/work/references/`

### 优化
- 精简 `work` skill，将 `light.md` 和 `work.md` 内联合并到 `skills/work/SKILL.md`，减少文件碎片

### 修复
- 修复 `hooks/session-start.mjs` 中重复读取 skill 文件导致的冗余 I/O
- 清理多个文件中过期的 `current-work` 引用

### 文档
- 重定义 `spec/current-work.md` 为追加式工作缓冲区，同步更新首跳路由和协调契约

## v0.4.2 - 2026-05-26

### 新增
- 新增Skill `create-skill`，用于创建和审核各种新的skill。

### 优化
- 依据 `create-skill` 审核各大skill，优化部分措辞

## v0.4.1 - 2026-05-19

### 新增
- 新增 `.claude-plugin/plugin.json`，支持以 Claude Code plugin 形式识别和安装
- 新增 `hooks/claude-hooks.json`，Claude Code 会话开始时自动注入 Gei 路由上下文（`SessionStart` hook，与 Codex 的 `hooks.json` 等价）
- 新增 `install-claude.mjs`，一键为 Claude Code 配置 skill junction 和 hook，无需手动复制文件，`git pull` 后自动同步

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
