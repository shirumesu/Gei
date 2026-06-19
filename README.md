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

**`/using-gei`** — 总路由，管理整个任务的生命周期

**`/consider`** — 追问并搜索主流做法，帮助你收敛与扩展思路，明确边界和影响，讨论好坏处

**`/memo`** — 完整 spec 维护层，负责维护整个 `spec/`，包括项目记忆

| 模块 | 职责 |
| --- | --- |
| `OVERVIEW` | 快速恢复上下文，描述项目，如何进行任务，如何阅读 `spec/`，透过 Hook 注入到会话开始 |
| `ARCHITECTURE & architecture/ ` | 在需要时提供整个系统的完整详细架构描述，包括系统运行、模块，改动影响范围，相关文件等 |
| `Docs / Spec-Plan` | 依据严谨流程编写，负责复杂 Plan 执行 |
| `CHANGELOG` | 项目任务追踪与版本发布维护：完成的变更直接记入 `## Unreleased`，发布时压缩成版本段，一句话发布 |
| `MEMORY & memory/` | 完整的记忆层，负责维护可重复流程、重复踩坑和项目约定；索引透过 Hook 注入到会话开始，结束检查由 Memo memory 收尾规则执行 |

**`/work`** — 完整的代码工作流程

- 按行为风险选择测试、构建、lint、脚本检查或发布门禁；只有新增或改变有稳定测试价值的行为时才新增测试，并优先从预期失败测试开始
- 代码修改维护准则 · 测试验证 · 发布流程

**`/memo`** ↩ — 依据 work 的工作，维护新的 Spec 变更

---

### 独立 Skill

**`/code-review`** — 独立只读代码审查流程，覆盖 PR / diff / commit / working tree 的正确性、测试、维护性、UX/DX 与安全风险

**`/create-skill`** — 详细的 Skill 编写指导，覆盖语气、标准写法等方方面面；另提供 Skill 优化、快速格式审查和测试流程

**`/see`** — 网络搜索分级（从快速到严谨），多层研究准则确保来源官方、客观、准确、可多重验证、独立验证；对已知 URL 可使用 Jina 辅助读取爬虫不友好的网页

---

## Skills

| Skill | 使用时机 | 用处 |
| --- | --- | --- |
| `/using-gei` | 任何会话开始前 | 总路由和任务生命周期维护层 |
| `/consider` | 讨论任何新想法时 | 帮助收敛需求；需求模糊时提供详细的设计方案 |
| `/memo` | 全工程 spec 与记忆维护 | 维护项目 Spec 层：架构、更改日志、方案设计和项目记忆 |
| `/work` | 任何代码执行任务 | 完整的编码、测试、版本维护及发布流程 |
| `/code-review` | 审查 PR、diff、commit、working tree 或实现结果时 | 只读审查代码正确性、测试质量、维护性、UX/DX、安全与发布风险 |
| `/see` | 外部研究、事实核查或来源综合是最终交付物时 | 完善的搜索流程，确保信息准确、可靠、具时效性；对已知 URL 可透过 [Jina](https://jina.ai/) 辅助读取网页 |
| `/create-skill` | Skill 相关操作时 | 创建与审核 Skill，验证可优化空间 |

## Hooks

本 Skill 提供三个 SessionStart Hook：`inject_using_gei` 注入 `using-gei` 路由器，`inject_overview` 注入 `project_has_spec: true|false` Flag 和项目 OVERVIEW 上下文，`inject_memory` 注入 `spec/MEMORY.md` 记忆索引。
`project_has_spec` 仅以是否存在 *spec/OVERVIEW.md* 为准。三个 hook 保持拆分，避免单个 hook 输出过长。

### 常见使用路径

| 场景 | 路径 | 备注 |
| --- | --- | --- |
| 完整的一次工作 | `using-gei` → memory recall → `consider` / `work` → `memo` memory close check | 几乎不需要主动调用任何命令；无操作 lifecycle 状态默认不打扰最终回复 |
| 代码审查 | `using-gei` → `code-review` | 只读审查，不进入 `work` 的实现生命周期 |
| 想法讨论 | `using-gei` → `consider` → `work` | 可显式使用 `consider`，思路更明确 |
| 对外搜索 | `using-gei` → `consider`（可选）→ `see` | `see` 要求澄清歧义、使用权威数据，结果更严谨 |

## AGENTS.md

个人的工作流，将会同步我自己使用的根目录级 `~/.codex/AGENTS.md`，用作参考和示例。  
由于仅作参考示例，不会包含在发布 release 包，请[单独查看](https://github.com/shirumesu/Gei/blob/main/AGENTS.md?plain=1)，如果有需要可以复制替换或者增强自己的 `AGENTS.md` 或是 `CLAUDE.md`  

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
