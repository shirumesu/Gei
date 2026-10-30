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
| memo | 用纯 Markdown 记下代码里找不到的东西：你的偏好、反复出现的做法、踩过的坑，按主题分文件，跨机器、跨 Agent 共用 |
| diagnose | 先拿到能复现的命令，找到根因再修 |
| inspect | 用新上下文的子代理对照原始需求审查改动，需手动调用 |

### Hooks

| 时机 | 做什么 |
| --- | --- |
| 会话开始 | 三个 Hook 分别注入 `AGENTS.md`、跨项目记忆、当前项目记忆；没有内容的不注入 |

### MCP

| 工具 | 做什么 |
| --- | --- |
| `spec_read` | 读取记忆 |
| `spec_search` | 搜索记忆 |
| `spec_edit` | 修改、新建、删除记忆文件 |

记忆默认存放在 `~/.agents/geispec`（可用 `GEI_SPEC_HOME` 修改），不需要在项目里加任何文件：

```text
AGENTS.md                      你的长期指令，会话开始时注入；Agent 只在你明确要求时修改
context/MEMORY.md              跨项目记忆的索引，会话开始时注入
context/<topic>.md             一个主题的记忆
projects/<project>/MEMORY.md   当前项目记忆的索引，会话开始时注入
projects/<project>/<topic>.md  一个主题的记忆
```

都是普通 Markdown，没有类型和元数据，在 GitHub 上可以直接读、直接改。`MEMORY.md` 只放索引，每行 `- [主题](主题.md) - 什么时候读`，注入的内容保持很小，Agent 需要时再读对应文件。同一主题的规则和事实合在一个文件里，每条写清做法、原因（Why）和用法（How to apply）。只记以后还会遇到的事，不记任务、进度和已完成工作的存档。每个文件注入时上限约 9,500 字符，超出会按行截断并提示 Agent 精简。`spec show projects/<project>/MEMORY.md` 可以看到会话实际收到的内容。

也可以改存到自己的 GitHub 私有仓库（告诉 Agent 绑定到哪个 repo 就好）。

详见[使用说明](docs/spec.md)。

<br>

## 致谢与许可

- [superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)

以 [MIT](LICENSE) 开源。更新记录见 [CHANGELOG.md](CHANGELOG.md)。
