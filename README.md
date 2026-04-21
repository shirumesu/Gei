# Gei - 芸

参考与启发自 [superpowers](superpowers)、 [gstack](https://github.com/garrytan/gstack)、 [Waza](https://github.com/tw93/waza)  
他们都是很优秀的 skill，但是这些 skill 很多都太重了，有的时候对于我目前的 `Codex` 环境兼容性也不足  
因此我写下了这个 skill

## 为什么要做这个？

- 过多的 skill，在 `Codex` 上会一次性全量读取，而不是按需加载：
	- 当你只想做一个简单 debug 任务，结果激活了4个5个 skill 还是同时激活
	- 当你觉得这个 skill 很好用但是却不知道具体依赖关系导致不知道该让 AI 读取哪个

因此我将其精简合并，并且融入了我自己的工作流程以及项目管理偏好。  
得益于此，几乎只需要使用一个 `/command` 就能开始你的任务（当然让他自动加载也行）

## Skills

| skill | 使用时机 | 用处 |
| ----- | ------- | ---- |
| `/kickoff` | 在任何创造性工作开始之前 | 他会帮助你收缩你的需求，尤其当你需求模糊的时候他会很好用，一般的任务从这里开始 |
| `/memo` | 任何项目文档管理 | 他维护了一个完整的 Spec 文档，包括每个 *Spec*、 *Plan*、 *TODO*、 *ChangeLog*、 *Architecture* 文件…，会自动在适当的时机激活维护。在 `/kickoff` 后会自动激活使用 |
| `/work` | 任何代码任务 | 定义了完整的编码、测试、代码审查、版本更迭、发布规范和他们相应的流程，几乎适合任何编码任务，如果项目拥有 Spec 文档，会在适当的时机激活 |
| `/design` | 实验性：当你在设计的时候使用他 | 提炼自 [Claude Design System prompt](https://gist.github.com/hqman/f46d5479a5b663c282c94faa8be866de) 具体效果未经验证 |

## 安装

### 付费购买 Token 安装

把这句话复制给你的 Agent：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### 免 Token 手动安装

请在 [release](https://github.com/shirumesu/gei/releases/latest) 这里下载 `Gei.zip`，把里面需要的 skill 目录解压到你的 skills 目录里即可。

## 更新日志 / 新发现

### v0.1 - 2026-04-21

- 首个公开发布版本：提供 `kickoff`、`memo`、`work`、`design` 四个 skill
- 新增：可直接给 Agent 拉取的安装文档 `docs/install.md`
- 新增：tag 触发的 GitHub Release Action，会自动打包 `Gei.zip`
- 文档：修正安装入口到远端实际的 `main` 分支，并整理安装说明

<details>
<summary>历史版本</summary>

### v0.0.3 - 2026-04-21

- 新增：tag 触发的 GitHub Release Action，会自动打包 `Gei.zip`
- 新增：`docs/install.md`
- 文档：补全 README 安装说明，明确多 skill 的安装方式

### v0.0.2 - 2026-04-21

- 新增：`work` skill，补齐执行、review 和 ship gate

### v0.0.1 - 2026-04-21

- 新增：初始化 `spec/` 系统，补齐 `kickoff` 和 `memo` 的项目内上下文

</details>
