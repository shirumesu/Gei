# Changelog

## Unreleased

## v0.9.0 - 2026-09-07

### 外部 Workspace
- GeiSpec 统一为项目外部的 INDEX、按领域展开的 Topics、带适用条件的决策/踩坑 Notes 和必要交接，取消固定五件套、Group 注册与默认内部 Changelog。
- SessionStart 自动分配缺少的 project.json 和最小 INDEX；重复启动不覆盖已有资料，并发会话发布完整文件。
- Git 子目录、linked worktree 和独立 Git 元数据目录复用项目身份；非 Git 目录各自独立，bare 仓库和 Git 元数据目录也可分配。保留当前 checkout 用于核对代码证据。
- 路由、workspace、共享经验通过三个独立 Hook 注入，完整输出上限为 2/4/1.5 KiB；领域正文按需读取，删除重复维护指令。
- Agent 自主维护可靠背景、有条件的取舍、已验证经验和失效路线。迁移先核对独有内容，再清除活跃区旧文件与占位目录；需要的快照独立保存。

### 任务 Skills
- Code Review 优先检查功能、交互、呈现、性能与一致性，区分缺陷和有依据的改善建议，按具体证据触发精简安全参考。
- Consider 主动提出竞争设计，用反例挑战自身推荐；按决策依赖追问，避免将设计工作转交给用户或重复审批。
- Work 保持为薄的交付约定，聚焦入口到消费者的完整路径、因果排查和实际结果验证；测试与发布参考按需加载。

### 结构与验证
- Codex marketplace 移至标准发现路径并使用仓库根 Git 来源，删除失效的本地路径；同步宿主入口、中英文说明及安装依赖。
- 用当前 Hook 合约检查替换旧只读启动测试，覆盖分配、身份、并发、独立输出预算、失败诊断和复制后的插件；CI 在 Windows/Linux 验证 Hook 与全部 Skill 格式。
- 合并重复上下文参考和验证说明，移除一次性评估报告、无发布流程调用的可选 Work 扫描器和空目录；原生 Changelog 保留公开历史。
- 格式验证器保留对模板注释示例的过滤，避免将示例链接误报为失效链接。

### 发布后维护
- 修复 Windows 8.3 短路径与长路径比较不一致导致迁移别名丢失项目身份的问题；统一真实路径比较，补充链接别名与子目录隔离回归检查，并修正 checkout 路径断言。
- Check 仅由分支 push 和 PR 触发，避免推送 main 与 tag 时重复运行；tag 继续触发发布流程。
- 以上两项修复已合入 main（提交 `1380613`），Windows/Linux CI 均通过；现有 v0.9.0 标签和下载包仍对应首次发布内容，尚未包含这些修复。

## v0.8.2 - 2026-08-12

### 新增
- 恢复 GeiSpec 的稳定架构地图、ADR、近期变更、版本/检查点整理与按需结构化 Change Spec 能力，同时保留 `IMPACTS.md`、Memory 和任务引用的独立职责。
- 新增独立 Project CHANGELOG SessionStart Hook，仅注入有实际内容的 `Unreleased`，空模板与已发布历史保持静默。

### 优化
- 所有 Project SessionStart Hook 统一通过幂等初始化器补齐最新 Project 骨架；并行创建只补缺、不覆盖已有 Overview、Architecture、Changelog、Memory 或扩展内容。
- 保持 Project OVERVIEW 为启动时的结构入口；Architecture、领域视图与 ADR 继续按需读取，避免扩大固定上下文。

### 移除
- 删除仓库内已跟踪的测试目录与测试脚本；Hook 和发布面改用直接运行探针、语法与配置解析检查验证。

## v0.8.0 - 2026-08-11

### 重大调整
- GeiSpec 改为 `~/.agents/geispec` 下的外部唯一存储；SessionStart 按精确工作目录自动创建固定 Project 模板，不再依赖项目内 Spec、目录绑定、模式或命令行生命周期。
- 新增 Group 共享层，让相关但独立目录的 Project 共享背景、影响关系与记忆，同时保留各自的 Project 上下文。
- 以聚焦跨组件后果的 `IMPACTS.md` 取代技术百科式 Architecture，并停止维护重复 Git / release notes 的内部 Changelog。

### 优化
- 将 SessionStart 拆为路由、共享记忆、Group Overview、Group Memory、Project Overview、Project Memory 六个独立 Hook；每个 Hook 独立初始化且空内容静默，兼容并行执行和宿主输出上限。
- 重构 Memo 为小型渐进披露路由，并把 Project、Group、Shared Context、Memory 和任务引用模板集中为 Hook 可复用的运行时资源。

### 移除
- 删除已放弃的 GeiSpec CLI、npm 包装、格式验证、迁移、旧目录回退和初始化脚本，以及相应发布配置与文档。

## v0.7.0 - 2026-07-26

### 重大调整
- 由于模型能力的提高，部分skill的流程和判断已经属于被内化的模型能力。因此依据 [Fable-5 context engineering 实践](https://x.com/trq212/status/2080710971228918066) 重构全部根 Skill：删除模型已内化的通用规则、固定状态机和重复生命周期，将 7 个入口 Skill 从约 1005 行压缩至约 293 行。
- 将 `/work` 改为证据驱动执行循环；TDD、持久计划、任务 Spec、commit checkpoint 和完整测试套件改为按风险与恢复价值选择。
- 保留轻量 Spec 生命周期：每个验证完成且值得归档的 `feat`、`fix`、`perf`、重要 `refactor/docs/workflow` 由 Work 追加到内部 `Unreleased`；重大结构变化当次更新 Spec，发布时再统一复核。
- 将 `/memo` 收缩为 Spec 合同和非平凡维护的所有者；Memory 与持久任务引用保持条件触发。

### 优化
- 将 `/create-skill` 改为删除优先的 context 设计流程，要求每条指令证明其上下文价值，并让行为验证与实际主张匹配。
- 精简 `/consider`、`/see` 与 `/code-review`，移除强制完整设计审批、固定研究等级、数字置信度和通用检查百科。
- 删除未再使用的通用写作指南和 Jina 专用说明；工具操作回归工具接口。
- 删除仓库中的个人 `AGENTS.md` 示例及 README 引用，避免把个人偏好作为 Gei 的公开工作流分发。
- 重构 `memo/scripts/init-spec.py`：默认保留现有文件，新增 `--dry-run`，仅在显式传入 `--add-gitignore` 时修改忽略规则，并停止自动 `git init` 或全局覆盖。

### 修复
- 降低 Ship Scanner 对单段前端路由、`@/` 模块别名和 JavaScript 正则字面量的误报，同时保留对 `/etc`、`/usr`、`/var` 等单段系统路径的检测，并新增针对性回归测试。
- 将 Ship Scanner 明确为可选的窄范围诊断，不再作为完整发布、安全或 secret gate。
- 修复 Codex 插件发布包遗漏 `hooks/` 与 `assets/icon.png` 的问题，确保清单声明的 SessionStart Hook 和图标随插件一同发布。
- 修复 `init-spec.py` 未在 dry-run 和结果摘要中报告 `spec/docs`、`spec/memory` 目录创建的问题。

## v0.6.5 - 2026-07-09

### 调整
- Claude-fable-5 验证
- 基于 Claude-skill 进行一轮自检和强化
- 优化 `/memo` 记忆相关的描述
- 补全License
- 强化 `/consider` 在提问上的描述决策

## v0.6.3 - 2026-06-19

### 移除
- 移除 `spec/current-work.md` 任务锚点，`spec/CHANGELOG.md` 的 `## Unreleased` 现在是唯一任务追踪面；一并移除 `work-anchor` 契约、`anchor-reconciliation` 事件和 active/paused/closed 锚点状态，需要跨会话续做的重活改用 `spec/docs/#NNN` task spec。
- 移除独立 `learn` Skill，项目记忆的读取、写入、维护和结束检查重新归入 `memo`。
- 移除 `stop_record_memory` Stop hook，避免会话结束时为了记忆检查额外追加一轮回复。

### 新增
- 新增 `inject_using_gei.mjs` SessionStart hook，每次会话开始注入完整 `using-gei` 路由（在 `hooks/hooks.json` 与 `hooks/codex-hooks.json` 中均最先注册），以 `skills/using-gei/SKILL.md` 为唯一来源。

### 优化
- 将记忆结束检查规则迁回 `memo`、`using-gei` 和 `work` 的技能契约，保留记忆写入门禁，但要求在同一条最终回复中完成。
- 将原 `learn` 的 recall、write gate、maintenance 和安全规则迁入 Memo memory 子流程。
- 降低 lifecycle 输出噪音：普通 memory 无操作状态默认不再进入最终回复，仅在影响决策、发生写入/冲突或用户询问时说明。
- 优化 `work`：按行为风险选择验证强度，允许低风险任务走 fast path，避免为短期、临时或命令行即可验证的改动新增低价值测试和 section checkpoint。
- 优化 `consider`：保留完整设计审批门槛，但在用户提出新问题时回到对应讨论阶段，等局部问题解决后再重新给完整方案请求审批。
- 压轻 `code-review` 输出契约，移除强制 Lake Score，并补齐 operations/release/recovery 审查 pass。

### 修复
- 修复 README 主流程漏列 `/create-skill`，并将 `/see` 的触发边界从“任何外部网络访问”收窄为外部研究/事实核查/来源综合作为最终交付物。
- 修复 `see` 的 `tool.md` progressive disclosure 定位，将其明确为受限平台/Jina 场景下叠加读取的 overlay。
- 修复 `create-skill` 的验证路线不一致，将 `testing.md` 作为创建/改进后的 validation overlay。
- 修复 `quick_validate.py` 与文档不一致的问题，现在会检查所有 Skill Markdown 文件中的本地链接。
- 将 Codex plugin `defaultPrompt` 从 4 条收敛到 3 条，避免超过当前宿主支持上限。

## v0.6.1 - 2026-06-07

### 修复
- 修复 `stop_record_memory` Stop hook 的记忆检查触发条件：现在只要项目包含 `spec/MEMORY.md`，每次会话停止前都会注入 Learn 记忆检查，不再因为 `current-work` 已归档或最终回复已有记忆标记而跳过。

## v0.6.0 - 2026-06-06

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
