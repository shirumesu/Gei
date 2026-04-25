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

### v0.2.2 - 2026-04-25

- 重构：
	- `Work\script\ship_scan` 完整解耦确保后续可维护性 & 增强性能 & 修复部分误报 & 修复显示错误 & 新增 [readme](./skills/work/scripts/README.md) 确保以后我还看得懂在干什么
- 修复：
	- `using-gei` 在 *description* 部分强调必须优先加载，确保为第一个被加载的 SKILL

<details>
<summary>历史版本</summary>

### v0.2.1 - 2026-04-23

- 重构：
	- `consider` 现在会更明确地停在设计阶段：先恢复最小必要上下文、澄清边界并输出可审批方案，批准前不进入实现
	- `memo` 拆分为事件引用与文档契约，入口只负责选择当前事件，后续只读取本次写入需要的规则
- 修复：
	- `using-gei` 现在会更准确地区分最终目标和支撑动作，只选择第一个下游 skill，避免为了搜集上下文提前加载不合适的 skill
	- 安装文档的完整安装示例补回 `see` 目录
	- `work` 现在会遵循 `memo` 的指引维护spec文档而不是在 `work` 中定义
- 文档：
	- 新增 `consider/references/read-spec.md`，明确有 spec 项目中的最小读取顺序
	- 补齐 v0.2.1 发布说明，覆盖 `v0.2` 后的 `consider`、`memo`、`using-gei` 更新

### v0.2 - 2026-04-23

- 新增：
	- `using-gei` 作为 Gei 的总路由 skill，用于在 `design`、`consider`、`memo`、`work` 之间分流
	- `see` skill，支持对比、事实核查、主题探索、教程检索、舆情采样和多源总结
	- `see` 的 `tool.md` 与 `health_check.py`，补充 Jina、Reddit、Twitter/X、小红书工具指引和本地环境检查
	- `work`的`ship_check`额外覆盖垃圾和缓存文件
	- `memo`新增显式调用的归档功能
- 更名：将 `kickoff` 统一更名为 `consider`，同步仓库路径、文档和路由表述
- 重构：`work` 改为路由入口，拆分轻量流程与 spec 驱动流程
- 修复：
	- `memo`未能正确写入work文件
	- `work`的`ship_check`误报
- 文档：更新安装说明，补齐 `using-gei` 与按需安装的说明

### v0.1 - 2026-04-21

- 首个公开发布版本：提供 `consider`、`memo`、`work`、`design` 四个 skill
- 新增：可直接给 Agent 拉取的安装文档 `docs/install.md`
- 新增：tag 触发的 GitHub Release Action，会自动打包 `Gei.zip`
- 文档：修正安装入口到远端实际的 `main` 分支，并整理安装说明
- 
### v0.0.3 - 2026-04-21

- 新增：tag 触发的 GitHub Release Action，会自动打包 `Gei.zip`
- 新增：`docs/install.md`
- 文档：补全 README 安装说明，明确多 skill 的安装方式

### v0.0.2 - 2026-04-21

- 新增：`work` skill，补齐执行、review 和 ship gate

### v0.0.1 - 2026-04-21

- 新增：初始化 `spec/` 系统，补齐 `consider` 和 `memo` 的项目内上下文

</details>

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
