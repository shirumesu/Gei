<p align="center">
  <img width="160" src="assets/icon.svg" alt="Gei icon" />
</p>

<h1 align="center">Gei ~ 芸</h1>

<p align="center">
  面向 Codex 的全套 AI Skill。涵盖设计、文档维护、项目管理、测试、编码、审查、发布、搜索等各种场景。
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
3. 更完善的工作流程，解决部分 skill 过重的问题  
4. 更全面，在编写代码的工程外也有 `see` 这类用于日常搜索验证的 skill  

## Skills

| skill | 使用时机 | 用处 |
| ----- | ------- | ---- |
| `/using-gei` | 在任何会话开始前使用 | 总路由和任务生命维护层 |
| `/consider` | 用于讨论任何新想法 | 他会帮助你收缩你的需求，尤其当你需求模糊的时候能给你一份详细的设计 |
| `/memo` | 全工程的文档维护 | 维护项目的 spec 层，记录项目架构、当前工作、更改日志和方案设计 |
| `/work` | 任何代码任务 | 完整的编码、测试、审查、版本维护以及发布的流程。 |
| `/see` | 任何对外的网络访问 | 提供了完善的搜索流程，确保信息准确，可靠，具时效性。透过[Jina](https://jina.ai/)优化搜索结果。并且支持访问 *reddit* / *twitter* / *小红书* 这类风控平台 |
| `/design` | 实验性：网页、PPT、文档设计等视觉任务 | 提炼自 [Claude Design System prompt](https://gist.github.com/hqman/f46d5479a5b663c282c94faa8be866de)，更适合界面、版式、原型、演示文稿等视觉产物 |

### 常见使用路径

| 场景 | 技能路径 | 备注 |
| ----- | ------- | ---- |
| 完整的一次工作 | `using-gei` → `consider` → `memo` → `work` → `memo` | 几乎不需要主动使用任何命令 |
| 想法讨论 | `using-gei` → `consider` → `work` | 可以显示用`consider`，会更明确 |
| 对外搜索 | `using-gei` → `consider(可选)` → `see` | see要求澄清歧义、使用权威、主流的数据并要求一定的压力测试，提供更严谨的搜索结果 |

## AGENTS.md

个人的工作流，将会同步我自己使用的根目录级 `~/.codex/AGENTS.md`，用作参考和示例。  

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

#### Codex非Plugin / Claude Code / 其他 Agent

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
    design/
      SKILL.md
```

甚至再套一层 `Gei/skills/<skill>` 也可以

#### git 安装（Claude Code / 其他 Agent）

也可以直接 `git clone https://github.com/shirumesu/gei.git`，后续用 `git pull` 更新，反而会更方便？

#### AGENTS.md

由于仅作参考示例，不会包含在发布 release 包，请[单独查看](https://github.com/shirumesu/Gei/blob/main/AGENTS.md?plain=1)，如果有需要可以复制替换或者增强自己的 `AGENTS.md` 或是 `CLAUDE.md`  

## 已知问题

- `/See` 依赖一部分[上游工具](#感谢)，他们不太稳定，偶尔需要自己手动注册登录态，skill 内已写好自动安装以及指引，你的 Agent 应该会指引你完成安装和登录。
	- 由于上游工具多是爬虫、cli自动化等，封号风险本身难以保证，若不想用，请在任务中明确向 AI 提出。

## 未来想法

- [ ] `/learn`，记忆系统？辅助学习？编写新skill的指南？我不知道…但总感觉如果是 芸 他需要这个。 

## 更新日志 / 新发现

最新公开版本日志见 [CHANGELOG.md](./CHANGELOG.md)。

## 感谢

- 灵感来源和参考：
	- [superpowers](superpowers)
	- [gstack](https://github.com/garrytan/gstack)
	- [Waza](https://github.com/tw93/waza)  
- 上游工具：
	- X 访问支持： [twitter-cli](https://github.com/public-clis/twitter-cli)
	- 小红书 访问支持： [xiaohongshu-cli](https://github.com/jackwener/xiaohongshu-cli)
	- Reddit 访问支持： [rdt-cli](https://github.com/public-clis/rdt-cli)
- 捐赠者
	- [我自己](https://github.com/shirumesu) 捐赠了一个完整的 人类大脑，有效降低了开发过程中的 token 成本
