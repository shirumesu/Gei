<p align="center">
  <img width="160" src="assets/icon.png" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  面向 Codex 的全套 AI Skill。涵盖需求澄清、文档维护、项目管理、测试、编码、审查、发布、搜索等各种场景。
</p>

<p align="center">
  <a href="README.en.md">English</a>
  |
  <span>简体中文</span>
</p>

现在的很多工程 skill 都太重了，并且基于 Claude Code 生态有的时候对 Codex 兼容并不完善。  
因此我写下了这个 skill  

## 他的作用？

1. 过多的 skill，在 `Codex` 上会一次性全量读取，而不是按需加载：明确的分段式披露，一次只加载一个skill  
2. skill 互相依赖过于复杂：保持简洁，单个 skill 作为路由入口，依据任务分流至详细内容，用户掌控性强  
3. 更完善，更全面的工作流程
4. 覆盖日常，在编写代码的工程外也有 `see` 这类用于日常搜索验证的 skill  

## 工作流程

> 所有 Skill 均内建**渐进式披露**与**路由分流**，全链路几乎不需要手动介入，Skill内自动内联。

### 主流程

/using-gei ──→ /consider | /memo | /work | /code-review | /see | /create-skill

**`/using-gei`** — 轻量总路由，按最终交付物选择 Skill

**`/consider`** — 只在方向、边界或高成本取舍仍不明确时进入设计

**`/memo`** — 显式维护 `spec/`、架构、项目记忆与持久交接文档

| 模块 | 职责 |
| --- | --- |
| `OVERVIEW` | 快速恢复上下文，描述项目，如何进行任务，如何阅读 `spec/`，透过 Hook 注入到会话开始 |
| `ARCHITECTURE & architecture/ ` | 在需要时提供整个系统的完整详细架构描述，包括系统运行、模块，改动影响范围，相关文件等 |
| `Docs / Task Reference` | 在跨会话恢复或交接确有价值时保存目标、决定、约束和高保真引用 |
| `CHANGELOG` | 每个验证完成且值得归档的实际变更追加到 `## Unreleased`，发布时压缩为版本记录 |
| `MEMORY & memory/` | 保存代码和常规文档无法直接揭示的项目约定、重复踩坑与隐藏约束；索引可透过 Hook 注入 |

**`/work`** — 证据驱动的代码执行流程

- 按风险和耦合选择最有辨识力的验证；测试先行、持久计划、提交检查点和完整测试套件都只在确有价值时使用
- 发布遵循项目自身策略，并验证真实产物或远端状态

---

### 独立 Skill

**`/code-review`** — 独立只读代码审查流程，覆盖 PR / diff / commit / working tree 的正确性、测试、维护性、UX/DX 与安全风险

**`/create-skill`** — 以删除优先和 progressive disclosure 创建、瘦身、审核与验证 Skill

**`/see`** — 按决策风险调整研究深度，区分事实、推断、分歧与未知

---

## Skills

| Skill | 使用时机 | 用处 |
| --- | --- | --- |
| `/using-gei` | Gei 已加载且请求可能匹配某个任务 Skill 时 | 按最终交付物选择一个入口 |
| `/consider` | 高影响设计或方向仍有实质不确定性时 | 恢复上下文、比较真实方案并给出可验证方向 |
| `/memo` | 用户或工作流明确需要持久项目文档时 | 维护架构、变更日志、任务引用和项目记忆 |
| `/work` | 任何代码执行任务 | 实施连贯改动并收集与风险相称的证据 |
| `/code-review` | 审查 PR、diff、commit、working tree 或实现结果时 | 只读审查代码正确性、测试质量、维护性、UX/DX、安全与发布风险 |
| `/see` | 外部研究、事实核查或来源综合是最终交付物时 | 使用可靠来源，主动检查反证并说明适用范围与不确定性 |
| `/create-skill` | Skill 相关操作时 | 创建、瘦身、审核 Skill，并用与主张匹配的证据验证 |

## Hooks

本 Skill 提供三个 SessionStart Hook：`inject_using_gei` 注入 `using-gei` 路由器，`inject_overview` 在存在 `spec/OVERVIEW.md` 时注入项目 OVERVIEW 上下文，`inject_memory` 在存在 `spec/MEMORY.md` 时注入记忆索引。
三个 hook 保持拆分，避免单个 hook 输出过长。

### 常见使用路径

| 场景 | 路径 | 备注 |
| --- | --- | --- |
| 已明确的代码工作 | `using-gei` → `work` | 直接实施并验证；完成后记录值得归档的结果，其他 Spec 与记忆更新按实际变化决定 |
| 代码审查 | `using-gei` → `code-review` | 只读审查，不进入 `work` 的实现生命周期 |
| 想法讨论 | `using-gei` → `consider` → `work` | 可显式使用 `consider`，思路更明确 |
| 对外搜索 | `using-gei` → `consider`（可选）→ `see` | `see` 要求澄清歧义、使用权威数据，结果更严谨 |

## 安装

### 付费购买 Token 安装

把这句话复制给你的 Agent：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### 免 Token 手动安装

> 预计节省约 10000 Token

#### Claude Code / Codex / Codex CLI

对 `Claude Code`、`Codex` 和 `Codex CLI`，可以按 **plugin** 方式安装。  

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git
```

之后在 Codex app 的 Plugins 页面，或 Codex CLI 的 `/plugins` 中安装并启用 `gei`。  

Claude Code 类似

#### 非Plugin / 其他 Agent

在 [release](https://github.com/shirumesu/gei/releases/latest) 下载 `Gei-skills.zip`，把需要的 skill 目录解压到你的 skills 目录里。  
大部分Agent可以接受子目录递归寻找，因此你的安装目录也可以看起来像这样:  
```text
<skills-dir>/
  Gei/
    using-gei/
      SKILL.md
    memo/
      SKILL.md
    ...
```

甚至再套一层 `Gei/skills/<skill>` 也可以

#### git 安装

也可以直接 `git clone https://github.com/shirumesu/gei.git`，后续用 `git pull` 更新

## 更新日志 / 新发现

最新公开版本日志见 [CHANGELOG.md](./CHANGELOG.md)。

## 感谢

- 灵感来源和参考：
	- [superpowers](superpowers)
	- [gstack](https://github.com/garrytan/gstack)
	- [Waza](https://github.com/tw93/waza)  
- 捐赠者
	- [我自己](https://github.com/shirumesu) 捐赠了一个完整的 人类大脑，有效降低了开发过程中的 token 成本
