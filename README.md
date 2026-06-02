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

> 所有
 Skill 均内建**渐进式披露**与**路由分流**，全链路几乎不需要手动介入，Skill内自动内联。 

### 主流程

/using-gei ──→ /consider ──→ /memo ──→ /work ──→ /memo


**`/using-gei`** — 总路由，管理整个任务的生命周期

**`/consider`** — 追问并搜索主流做法，帮助你收敛与扩展思路，明确边界和影响，讨论好坏处

**`/memo`** — 完整文档维护层

| 模块 | 职责 |
| --- | --- |
| `current-work` | 系列连续任务的完整记录 |
| `OVERVIEW & ARCHITECTURE` | 快速恢复上下文 |
| `Docs / Spec-Plan` | 依据严谨流程编写，负责复杂 Plan 执行 |
| `CHANGELOG` | 辅助版本发布维护，固定发布流程，一句话发布 |

**`/work`** — 完整的代码工作流程

- 从 `current-work` 开始，覆盖详细的测试编写指引（依据预期失败的测试开始工作）
- 代码修改维护准则 · 审查 · 子 Agent 运用 · 发布流程

**`/memo`** ↩ — 依据 work 的工作，维护新的 Spec 变更

---

### 独立 Skill

**`/create-skill`** — 详细的 Skill 编写指导，覆盖语气、标准写法等方方面面；另提供 Skill 优化、快速格式审查和测试流程

**`/see`** — 网络搜索分级（从快速到严谨），多层研究准则确保来源官方、客观、准确、可多重验证、独立验证；对已知 URL 可使用 Jina 辅助读取爬虫不友好的网页

---

## Skills

| Skill | 使用时机 | 用处 |
| --- | --- | --- |
| `/using-gei` | 任何会话开始前 | 总路由和任务生命周期维护层 |
| `/consider` | 讨论任何新想法时 | 帮助收敛需求；需求模糊时提供详细的设计方案 |
| `/memo` | 全工程文档维护 | 维护项目 Spec 层：架构、当前工作、更改日志和方案设计 |
| `/work` | 任何代码任务 | 完整的编码、测试、审查、版本维护及发布流程 |
| `/see` | 任何对外网络访问 | 完善的搜索流程，确保信息准确、可靠、具时效性；对已知 URL 可透过 [Jina](https://jina.ai/) 辅助读取网页 |
| `/create-skill` | Skill 相关操作时 | 创建与审核 Skill，验证可优化空间 |

## Hooks

本 Skill 提供两个 SessionStart Hook：`inject_using_gei` 自动注入 `using-gei` 全文，`inject_overview` 自动注入 `project_has_spec: true|false` Flag 和项目 OVERVIEW 上下文。
`project_has_spec` 仅以是否存在 *spec/OVERVIEW.md* 为准；Claude Code 和 Codex 都会通过第二个 Hook 自动注入 *spec/OVERVIEW.md* 全文。

### 常见使用路径

| 场景 | 路径 | 备注 |
| --- | --- | --- |
| 完整的一次工作 | `using-gei` → `consider` → `memo` → `work` → `memo` | 几乎不需要主动调用任何命令 |
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

#### Codex / Codex CLI

对 `Codex` 和 `Codex CLI`，可以按 **plugin** 方式安装。  

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git --sparse .agents/plugins
```

之后在 Codex app 的 Plugins 页面，或 Codex CLI 的 `/plugins` 中安装并启用 `gei`。

当前阶段如果你的 Codex 版本、marketplace 内容或环境暂时还不能完整走通这条路径，可以按顺序尝试：

1. 更新 `~/.codex/config.toml` 中的 marketplace / plugin 配置；
2. 把插件目录直接放到 `~/.codex/plugins/cache/gei/` 下，让 Codex 先识别本地插件；
3. 最后再退回 release 包里的 `Gei-codex-plugin.zip` 手动解压。

#### Claude Code Plugin 安装（含 Hook）

需要 Node.js 可用。将仓库 clone 到任意位置后，运行内置的安装脚本：

```shell
git clone https://github.com/shirumesu/gei.git ~/.agents/Gei
node ~/.agents/Gei/hooks/install-claude.mjs
```

脚本自动完成：

- 在 `~/.claude/skills/` 下创建指向本仓库 `skills/` 的目录 junction，skills 随 `git pull` 自动同步
- 将两个 `SessionStart` hooks 写入 `~/.claude/settings.json`，会话开始时自动注入 Gei 路由上下文和 OVERVIEW 全文

重启 Claude Code 后生效。后续只需 `git pull` 更新仓库，不需要重新运行脚本。

#### 非Plugin / 其他 Agent

在 [release](https://github.com/shirumesu/gei/releases/latest) 下载 `Gei-skills.zip`，把需要的 skill 目录解压到你的 skills 目录里。  
大部分Agent可以接受子目录递归寻找，因此你的安装目录也可以看起来像这样:  
```text
<skills-dir>/
  Gei/
    using-gei/
      SKILL.md
    work/
      SKILL.md
    memo/
      SKILL.md
    see/
      SKILL.md
    consider/
      SKILL.md
```

甚至再套一层 `Gei/skills/<skill>` 也可以

#### git 安装

也可以直接 `git clone https://github.com/shirumesu/gei.git`，后续用 `git pull` 更新

## 未来想法

- [ ] `/learn`，记忆系统？辅助学习？编写新skill的指南？我不知道…但总感觉如果是 芸 他需要这个。 

## 更新日志 / 新发现

最新公开版本日志见 [CHANGELOG.md](./CHANGELOG.md)。

## 感谢

- 灵感来源和参考：
	- [superpowers](superpowers)
	- [gstack](https://github.com/garrytan/gstack)
	- [Waza](https://github.com/tw93/waza)  
- 捐赠者
	- [我自己](https://github.com/shirumesu) 捐赠了一个完整的 人类大脑，有效降低了开发过程中的 token 成本
