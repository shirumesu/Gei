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
| memo | 只记代码里找不到、能防住具体错误的短条目：约定、踩过的坑、环境、取舍理由 |
| diagnose | 先拿到能复现的命令，找到根因再修 |
| inspect | 用新上下文的子代理对照原始需求审查改动，需手动调用 |

### Hooks

| 时机 | 做什么 |
| --- | --- |
| 会话开始 | 注入当前项目和跨项目的记忆条目，以及文档、任务列表；显示上次后台整理的结果 |
| 发消息、回复结束、会话结束 | 记录会话内容，排队交给后台整理 |

后台整理用当前工具的无头模式（`claude -p` 或 `codex exec`）把会话里真正值得留下的条目写进记忆，不打断会话。`spec background off` 可关闭。

### MCP

| 工具 | 做什么 |
| --- | --- |
| `spec_read` | 读取记忆、文档和任务 |
| `spec_search` | 搜索知识库 |
| `spec_edit` | 增删改记忆条目，新建或修改文档和任务 |

知识默认存放在 `~/.agents/geispec`（可用 `GEI_SPEC_HOME` 修改），按项目名分目录，不需要在项目里加任何文件：

```text
projects/<project>/
  MEMORY.md        记忆条目，会话开始时全部注入
  docs/<doc>.md    长文档，只列标题和一句话描述
  tasks/<task>.md  进行中的任务
  INDEX.md         自动生成的文档和任务列表
context/           跨项目共用，结构相同
```

每条记忆只能是四种之一：`rule`（约定）、`pitfall`（常规做法在这里会失败）、`env`（仓库外的环境事实）、`why`（代码里看不出的取舍理由），字段固定、长度有上限。项目记忆写满（7000 字节）后会拒绝新条目，必须先删或合并。所以记忆不会无限变大，每次注入都不会被截断。`MEMORY.md` 在 GitHub 上也能直接读和改；`spec show projects/<project>/` 可以看到会话实际收到的内容。

也可以改存到自己的 GitHub 私有仓库（告诉 Agent 绑定到哪个 repo 就好）。

详见[使用说明](docs/spec.md)。

<br>

## 致谢与许可

- [superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)
- 后台整理参考了 mem0、OpenViking 的 Claude Code / Codex 插件

以 [MIT](LICENSE) 开源。更新记录见 [CHANGELOG.md](CHANGELOG.md)。
