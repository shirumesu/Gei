<p align="center"><img width="160" src="assets/icon.png" alt="Gei icon" /></p>

# Gei ~ 芸

[English](README.en.md) | 简体中文

Gei 为 Codex 和 Claude Code 提供小型任务 Skills，以及项目外部的知识维护。Hook 注入简短背景与读取路线；Agent 按领域取用知识，并自主保存有条件的取舍、踩坑经验和必要交接。项目无需新增 AGENTS.md 或 Spec 目录。

## Skills

| Skill | 最终目标 |
| --- | --- |
| using-gei | 选择匹配任务的入口；触发有价值的自主知识更新 |
| consider | 挖掘真实需求，主动提出竞争方案，以反例挑战并完善设计 |
| work | 贯通入口、实现与消费者，以实际结果验证交付 |
| memo | 维护外部项目背景、领域入口、决策经验与交接 |
| code-review | 只读审查功能、交互、呈现、性能与风格一致性 |
| see | 外部研究、事实核查和来源综合 |
| create-skill | 创建、精简、审核和验证 Skills |

普通读取不需要加载 Memo。清晰任务直接执行；复杂需求才进入 Consider。Skills 和它们的条件参考按需加载；Gei 的作用是提供明确的任务边界与项目知识约定。

Consider 负责带着方案参与设计，并挑战自己的推荐；Code Review 以实际体验和有依据的一致性判断为主。Work 保持为薄的交付约定，其额外价值需要真实任务验证，参见[验证范围](docs/verification.md)。

## 外部项目知识

默认存储在 `~/.agents/geispec`，可用 `GEI_SPEC_HOME` 覆盖。启动只分配按项目名组织的最小 `INDEX.md`，无需身份元数据；其余内容只在获得实际知识时创建：

```text
projects/<project-name>/
  INDEX.md
  topics/<domain>/
    README.md
    notes/<decision-or-pitfall>.md
  tasks/<task>.md
context/
  INDEX.md
  notes/<cross-project-lesson>.md
```

- **INDEX**：短项目背景、确认的工作约定、业务词汇到领域的读取路线，承担启动上下文入口。
- **Topic**：领域概念、责任边界、影响方案的约束，以及代码、测试、原生文档和相关记录的入口。
- **Note**：结论及状态、适用条件、实际取舍或已验证原因、重评条件和证据。一条记录拥有一个事实，其他位置只保留检索提示。
- **Task**：只有已接受工作需要跨会话恢复时才创建，完成后移除活动入口。
- **Context**：仅保存适用条件确实跨越无关项目的经验，默认写入仍归项目。

从 Hook 已注入的 INDEX 直接进入匹配领域，再读取相关记录或代码，无需先用工具重读 INDEX。仅在索引内容缺失、截断、需要刷新，或修改索引前获取 revision 时读取 INDEX。搜索使用业务概念、症状和评价标准。只有具体依赖才扩大范围；没有资料时直接搜索项目证据。领域过大后按责任拆分，不维护全库文件清单。

历史 A/B 选择用于未来 C/D 判断时，Agent 应检查当时的优先级与限制是否仍成立，并解释新条件可能怎样改变结论。用户确认、Agent 推断、已接受未实现和已实现事实必须区分。

## 自主维护

出现可靠背景、已接受的重要取舍、验证过的可复用坑、过时事实/路线或必要交接时，Agent 在当前任务内直接更新外部资料，无需另外询问是否记住。宿主的文件权限仍然有效。

普通修改不强制写笔记或内部 Changelog，也不触发全库审计。外部知识优先链接已有权威资料，只补充会改变理解或决策的内容。维护规则见 [Memo](skills/memo/SKILL.md)。

`spec_check` 一次返回有限的维护清单，AI 按证据保留、更新、删除或延期；项目低频使用和复核到期都不会自动删除知识。`spec_gc` 只清理明确约定销毁日期的临时记录，默认预览，同时检查引用。没有归档搜索层。元数据、删除恢复和可选定时运行见[知识维护](docs/maintenance.md)。

## Hooks 与读取预算

三条独立 SessionStart Hook 分别负责任务路由、workspace 分配与项目入口、共享经验入口。仅 workspace Hook 写入缺少的最小索引；重复启动保留已有文件。各 Hook 可独立运行，不依赖执行顺序；不会加载领域正文、笔记或历史。用户无需自行维护 AGENTS.md。

路由完整输出上限 2 KiB，workspace 完整输出上限 4 KiB，共享入口完整输出上限 1.5 KiB。Project/Shared INDEX 正文分别最多 3/1 KiB，路径占用也计入整体预算。以 UTF-8 字节计量，超限保留完整行并提示读取源索引；不会通过拆分 Hook 注入整库资料。

普通 Git 项目及其子目录、linked worktree 使用主仓库目录名；独立 Git 元数据或 bare 仓库使用 common Git 目录名；嵌套仓库和非 Git 目录各自取名。名称规范化为小写等可移植形式，完整规则见 [存储约定](skills/memo/references/storage.md)。同名项目有意共享知识；无关项目应使用不同名称。移动路径无需配置，改名则需同步调整知识目录及引用。

默认本地使用，无需账号。也可连接自己的 GitHub 私有知识仓库：两端项目名一致并绑定同一知识仓库后，工具直接读取和保存远端内容，无需 Agent 另行 push。Hook 使用有版本的 INDEX 缓存，过期后短时检查远端，离线时标明缓存状态。平台与分支特有的经验保留适用条件，不因跨机同步变成通用结论。

## Spec 工具与开关

插件捆绑本地 stdio MCP，不需要部署服务器。`spec_read`、`spec_search`、`spec_edit`、`spec_status` 统一访问本地或 GitHub；编辑支持精确文本替换和多文件批量更新，检查基础版本以避免多会话覆盖。Markdown 格式和目录结构保持不变。日常维护通过工具完成，避免直接编辑共享目录或并行执行 Git 同步。

```shell
node <gei>/bin/gei.mjs spec status
node <gei>/bin/gei.mjs spec disable
node <gei>/bin/gei.mjs spec enable
node <gei>/bin/gei.mjs spec connect github --repo owner/private-knowledge
node <gei>/bin/gei.mjs spec use local
```

连接与切回命令先预览，加入 `--apply` 执行；新建私有仓库可加 `--create`。切回本地会先备份原有内容。关闭 Spec 保留数据和其他 Skills。GitHub 模式断网时只读缓存，不创建可写本地分支或排队上传。身份认证、仓库绑定、完整缓存刷新和 Skills-only CLI 入口见[使用说明](docs/spec.md)；接口依据见[工具设计](docs/spec-tools.md)。安装不会添加全局 `gei` 命令。

升级旧路径哈希存储前，先按 [迁移规则](skills/memo/references/migrate.md) 合并到命名目录并修复链接。Hook 发现旧副本会报告迁移需求，保留原文档，不静默新建空知识或选取其中一端。

已有旧五件套且缺少 INDEX 时，分配的索引保留旧资料链接。Agent 按[迁移规则](skills/memo/references/migrate.md)核对并整理后，清除活跃知识区的旧文件与占位目录；需要的迁移快照放在活跃存储之外。

## 安装

让 Agent 获取并执行 [安装指南](docs/install.md)：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

也可以使用宿主的插件市场安装并启用 Gei。仅使用 [Skills 压缩包](https://github.com/shirumesu/gei/releases/latest) 的宿主可按需调用 Skills，但不会自动获得插件的 Hook 注入。安装过程不修改 AGENTS.md、CLAUDE.md 或其他无关配置。

## 验证与发布历史

```shell
node .github/scripts/check_hooks.mjs
node --test tests/spec.test.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

请在源码仓库运行这些命令，运行时需要 Node.js 22 或更新版本；格式验证需要 PyYAML。CI 配置覆盖 Windows/Linux/macOS 的 Hook、存储/协议回归与全部 Skill 格式检查；测试不证明模型一定遵循指令或节省特定比例的 token。当前验证范围见[验证说明](docs/verification.md)。

公开版本历史见 [CHANGELOG.md](CHANGELOG.md)。

## 致谢

参考：[superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)。
