<p align="center"><img width="160" src="assets/icon.png" alt="Gei icon" /></p>

# Gei ~ 芸

[English](README.en.md) | 简体中文

Gei 为 Codex 和 Claude Code 提供小型任务 Skills，以及项目外部的知识维护。Hook 注入简短背景与读取路线；Agent 按领域取用知识，并自主保存有条件的取舍、踩坑经验和必要交接。项目无需新增 AGENTS.md 或 Spec 目录。

## Skills

| Skill | 最终目标 |
| --- | --- |
| using-gei | 选择匹配任务的入口；触发有价值的自主知识更新 |
| consider | 明确需求、调查关键不确定性、比较有条件的取舍 |
| work | 实施明确任务并进行与风险相称的验证 |
| memo | 维护外部项目背景、领域入口、决策经验与交接 |
| code-review | 只读审查实现与验证证据 |
| see | 外部研究、事实核查和来源综合 |
| create-skill | 创建、精简、审核和验证 Skills |

普通读取不需要加载 Memo。清晰任务直接执行；复杂需求才进入 Consider。Skills 和它们的条件参考按需加载；Gei 的作用是提供明确的任务边界与项目知识约定。

## 外部项目知识

默认存储在 `~/.agents/geispec`，可用 `GEI_SPEC_HOME` 覆盖。以下内容按实际需要创建，启动不会生成空骨架：

```text
projects/<project-id>/
  project.json
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

读取路径是 INDEX → 匹配领域 → 相关记录或代码；搜索使用业务概念、症状和评价标准。只有具体依赖才扩大范围；没有资料时直接搜索项目证据。领域过大后按责任拆分，不维护全库文件清单。

历史 A/B 选择用于未来 C/D 判断时，Agent 应检查当时的优先级与限制是否仍成立，并解释新条件可能怎样改变结论。用户确认、Agent 推断、已接受未实现和已实现事实必须区分。

## 自主维护

出现可靠背景、已接受的重要取舍、验证过的可复用坑、过时事实/路线或必要交接时，Agent 在当前任务内直接更新外部资料，无需另外询问是否记住。宿主的文件权限仍然有效。

普通修改不强制写笔记或内部 Changelog，也不触发全库审计。外部知识优先链接已有权威资料，只补充会改变理解或决策的内容。维护规则见 [Memo](skills/memo/SKILL.md)。

## Hooks 与读取预算

两条独立 SessionStart Hook 分别注入任务路由和项目知识入口。后者只读取项目元数据及 Project/Shared INDEX，提供自主维护指令；不会加载领域正文、笔记、历史或兄弟项目内容。用户无需自行维护 AGENTS.md；已有用户和仓库指令仍然优先。

Project INDEX 正文上限 3 KiB，Shared INDEX 正文上限 1 KiB，知识上下文整体上限 7 KiB，路由正文上限 2 KiB。以 UTF-8 字节计量，超限只保留完整行，并提示按需读取源索引及精简。这些是输出上限，不是 token 数量或宿主 UI 展示保证。

Git 子目录与 linked worktree 使用同一知识身份，并保留当前 checkout 路径用于核对证据；嵌套 Git 仓库独立。非 Git 项目按目录识别，已有 root/aliases 元数据可将其子目录关联起来。移动项目时更新原有元数据即可复用知识。

旧五件套保留为按需迁移来源。Hook 在缺少新 INDEX 时只报告旧文件位置；Agent 按 [迁移规则](skills/memo/references/migrate.md) 核对后迁移，禁止直接丢弃未审阅的旧知识。

## 安装

让 Agent 获取并执行 [安装指南](docs/install.md)：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

也可以使用宿主的插件市场安装并启用 Gei。仅使用 [Skills 压缩包](https://github.com/shirumesu/gei/releases/latest) 的宿主可按需调用 Skills，但不会自动获得插件的 Hook 注入。安装过程不修改 AGENTS.md、CLAUDE.md 或其他无关配置。

## 验证与发布历史

```shell
node --test tests/knowledge.test.mjs
python skills/create-skill/scripts/quick_validate.py skills/memo
```

请在源码仓库运行这些命令；格式验证需要 PyYAML。CI 在 Windows/Linux 上运行 Hook 回归与全部 Skill 格式检查；测试不证明模型一定遵循指令或节省特定比例的 token。行为评估案例见 [Memo 行为检查](docs/memo-behavior.md)。

公开版本历史见 [CHANGELOG.md](CHANGELOG.md)。

## 致谢

参考：[superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)。
