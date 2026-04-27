# Gei - 芸

现在的很多工程 skill 都太重了，并且基于 Claude Code 生态有的时候对 Codex 兼容并不完善。  
因此我写下了这个 skill  

## 为什么要做这个？

- 过多的 skill，在 `Codex` 上会一次性全量读取，而不是按需加载：
	- 当你只想做一个简单 debug 任务，结果激活了4个5个 skill 还是同时激活
	- 当你觉得这个 skill 很好用但是却不知道具体依赖关系导致不知道该让 AI 读取哪个

因此我将其精简合并，并且融入了我自己的工作流程以及项目管理偏好。  
得益于此，大多数任务都只需要从一个入口开始（当然让他自动加载也行）  

## Skills

| skill | 使用时机 | 用处 |
| ----- | ------- | ---- |
| `/using-gei` | 在任何会话开始前使用 | 总路由层。判断当前任务该如何使用SKILL |
| `/consider` | 在任何创造性工作开始之前 | 他会帮助你收缩你的需求，尤其当你需求模糊的时候他会很好用，一般的任务从这里开始 |
| `/memo` | 工程项目的规范 / task / spec 记忆维护 | 维护项目的记忆层，具备一套完整的项目架构记录、规范、TODO、CHANGELOG日志记录，每个工作都可追溯，可无上下文加载。额外提供显式要求归档时自动归档。 |
| `/work` | 任何代码任务 | 完整的编码、测试、审查、版本维护以及发布的流程，几乎适合任何编码任务。已内部路由分为轻量版和工程版，区别为工程版流程更重且会采用子agent |
| `/see` | 任何对外的网络访问 | 提供了完善的搜索流程，确保信息准确，可靠，具时效性。透过[Jina](https://jina.ai/)优化搜索结果。并且支持访问 *reddit* / *twitter* / *小红书* 这类风控平台 |
| `/design` | 实验性：网页、PPT、文档设计等视觉任务 | 提炼自 [Claude Design System prompt](https://gist.github.com/hqman/f46d5479a5b663c282c94faa8be866de)，更适合界面、版式、原型、演示文稿等视觉产物 |

## 安装

### 付费购买 Token 安装

把这句话复制给你的 Agent：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### 免 Token 手动安装

请在 [release](https://github.com/shirumesu/gei/releases/latest) 这里下载 `Gei.zip`，把里面需要的 skill 目录解压到你的 skills 目录里即可。

## 已知问题

- `/See` 依赖一部分[上游工具](#感谢)，他们不太稳定，偶尔需要自己手动注册登录态，skill 内已写好自动安装以及指引，你的 Agent 应该会指引你完成安装和登录。
	- 由于上游工具多是爬虫、cli自动化等，封号风险本身难以保证，若不想用，请在任务中明确向 AI 提出。

## TODO

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
