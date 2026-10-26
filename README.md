<div align="center">

<img src="assets/icon.png" alt="Gei" width="160">

<h3>Gei ~ 芸</h3>

<p><sub>给 Codex 和 Claude Code 用的小型 Skills，加上放在项目外面的知识库</sub></p>

<p>
  <a href="https://github.com/shirumesu/Gei/releases"><img alt="版本" src="https://img.shields.io/github/v/release/shirumesu/Gei?label=%E7%89%88%E6%9C%AC&color=22B388"></a>
  <img alt="宿主" src="https://img.shields.io/badge/%E5%AE%BF%E4%B8%BB-Codex%20%7C%20Claude%20Code-0F5C46">
  <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/github/license/shirumesu/Gei?label=%E8%AE%B8%E5%8F%AF%E8%AF%81&color=0F5C46"></a>
  <img alt="MCP" src="https://img.shields.io/badge/MCP-stdio-FF6B81">
</p>

<h4>
  <a href="#安装">安装</a> &nbsp;｜&nbsp;
  <a href="#组成">组成</a> &nbsp;｜&nbsp;
  <a href="https://github.com/shirumesu/Gei/issues">反馈问题</a>
</h4>

[English](README.en.md) | 简体中文

</div>

## 安装

### 消耗地球 online 金币购买

把这句话发给你的 Agent：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/shirumesu/gei/refs/heads/main/docs/install.md
```

### 免费安装

<details>
<summary><b>Codex</b></summary>

```shell
codex plugin marketplace add https://github.com/shirumesu/gei.git
```

然后在 Codex 的插件管理里启用 `gei`，重启后新开会话生效。

</details>

<details>
<summary><b>Claude Code</b></summary>

```shell
/plugin marketplace add shirumesu/gei
/plugin install gei@gei-claude
```

</details>

<details>
<summary><b>其他支持 Skills 的工具</b></summary>

下载 [Gei-skills.zip](https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip)，解压到工具读取 Skills 的目录；或者直接 clone，之后用 `git pull` 更新：

```shell
git clone https://github.com/shirumesu/gei.git <skills-dir>/Gei
```

这种方式只有 Skills，不包含 Hooks 和 MCP。

</details>

<br>

## 组成

### Skills

| Skill | 做什么 |
| --- | --- |
| consider | 动手前判断值不值得做、怎么做、会锁定什么 |
| memo | 记录和维护项目的背景、决策和交接 |
| diagnose | 先拿到能复现的命令，找到根因再修 |
| inspect | 用新上下文的子代理对照原始需求审查改动，需手动调用 |

### Hooks

| 时机 | 做什么 |
| --- | --- |
| 会话开始 | 注入当前项目的知识索引和跨项目经验，不加载正文；显示上次后台整理的结果 |
| 发消息、回复结束、会话结束 | 记录会话内容，排队交给后台整理 |

后台整理用当前工具的无头模式（`claude -p` 或 `codex exec`）把会话里值得留下的内容写进知识库，不打断会话。`spec background off` 可关闭。

### MCP

| 工具 | 做什么 |
| --- | --- |
| `spec_read` | 读取知识文档 |
| `spec_search` | 搜索知识库 |
| `spec_edit` | 新建或修改知识文档 |
| `spec_check` | 检查坏链接、主题 README 未链接的笔记、重复内容、过时的来源 |
| `spec_status` | 查看当前知识库位置和状态 |

知识默认存放在 `~/.agents/geispec`（可用 `GEI_SPEC_HOME` 修改），按项目名分目录，不需要在项目里加任何文件：

```text
projects/<project>/
  INDEX.md
  topics/<domain>/README.md
  topics/<domain>/notes/<note>.md
  tasks/INDEX.md
  tasks/<task>.md
context/
  INDEX.md
  notes/<lesson>.md
```

`spec_edit` 会在同一次保存里重写该项目的 `INDEX.md`：每个主题 README 一行，再加上最近的至多五条任务。超过五条时末行是 `更多任务 N 个，见 [tasks/INDEX.md](tasks/INDEX.md)`。全部任务在不注入的 `tasks/INDEX.md`。生成块外面的标题和约定仍可手写。

也可以改存到自己的 GitHub 私有仓库（告诉 Agent 绑定到哪个 repo 就好）。

详见[使用说明](docs/spec.md)。

<br>

## 致谢与许可

- [superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)
- 后台整理参考了 mem0、OpenViking 的 Claude Code / Codex 插件

以 [MIT](LICENSE) 开源。更新记录见 [CHANGELOG.md](CHANGELOG.md)。
