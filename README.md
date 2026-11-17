<div align="center">

<img src="assets/icon.png" alt="Gei" width="160">

<h3>Gei ~ 芸</h3>

<p><sub>给 Codex 和 Claude Code 用的小型 Skills，加上放在项目外面的知识库</sub></p>

<p>
  <a href="https://github.com/shirumesu/Gei/releases"><img alt="版本" src="https://img.shields.io/github/v/release/shirumesu/Gei?label=%E7%89%88%E6%9C%AC&color=22B388"></a>
  <img alt="宿主" src="https://img.shields.io/badge/%E5%AE%BF%E4%B8%BB-Codex%20%7C%20Claude%20Code-0F5C46">
  <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/github/license/shirumesu/Gei?label=%E8%AE%B8%E5%8F%AF%E8%AF%81&color=0F5C46"></a>
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
/plugin install gei@gei
```

</details>

<details>
<summary><b>其他支持 Skills 的工具</b></summary>

下载 [Gei-skills.zip](https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip)，解压到工具读取 Skills 的目录；或者直接 clone，之后用 `git pull` 更新：

```shell
git clone https://github.com/shirumesu/gei.git <skills-dir>/Gei
```

这种方式只有 Skills，不包含 Hooks、memo 工具和 `memo` 命令，所以没有记忆。

</details>

<br>

## 组成

### Skills

| Skill | 做什么 |
| --- | --- |
| consider | 动手前判断值不值得做、怎么做、会锁定什么 |
| memo | 把代码里找不到的东西记成一张短条目表：你的偏好和纠正、会再遇到的坑。存在本机数据库里，经一个 git 仓库跨机器、跨 Agent 同步；Agent 用插件带的 memo 工具查和写，每次调用和结果你都看得到 |
| diagnose | 先拿到能复现的命令，找到根因再修 |
| inspect | 用新上下文的子代理对照原始需求审查改动，需手动调用 |
| deslop | 给已有设计语言的产品去掉“AI 味”：逐页审查粗体小字、无意义的彩色、闪光图标、重复的状态和不齐的间距，你逐条选，只改选中的并同步设计文档 |

### memo 工具

插件带一个本地 MCP 服务，Agent 通过它读写记忆，调用和返回内容都显示在对话里：

| 工具 | 做什么 |
| --- | --- |
| `brief` | 会话的第一个任务前调用一次：置顶条目、哪些情况该查、常用键，不超过 3,500 字符 |
| `find` | 每个任务前按几个词查，最多返回 3 条 |
| `keys`、`show` | 列出键；看一条的全部字段和修订历史 |
| `put`、`wrong`、`del` | 写入或修订一条（相近的会被拒绝并要求选替换还是新增）；标错；删除 |

### Hooks

Hooks 不往上下文里放任何条目，只做下面这些：

| 时机 | 做什么 |
| --- | --- |
| 会话开始 | 同步记忆库，送入两行基础用法 |
| 调用 `brief`、`find` 之后 | 记下这次给 Agent 看了哪些条目 |
| 每轮回复结束（含子代理） | 统计回复里引用了哪些条目并更新强弱；有改动时同步，失败会显示出来 |

### 记忆

记忆是一张短条目表。每条有 1 到 6 个键、什么情况下想起（`when`）、要做什么（`do`，最多 300 字符）和来源（`why`）。工作库是本机的 SQLite 文件 `~/.agents/gei-state/memo.db`；`~/.agents/geispec` 是一个 git 仓库（建议克隆你自己的私有仓库），负责把条目带到别的机器，不需要在项目里加任何文件：

```text
~/.agents/geispec/
  AGENTS.md                           你的长期指令，由 Claude Code 和 Codex 自己加载
  projects/<project>/entries.jsonl    一个项目的条目快照，一行一条
  projects/<project>/signals.tsv      条目强弱的快照
  projects/<project>/docs/            放不进条目的长文档
  context/                            跨项目范围，结构相同
```

Agent 只通过 memo 工具读写，不会自己去翻记忆库文件。条目只在 Agent 调用 `brief`、`find` 时送到，每次返回的量有上限，所以条目再多，占用的上下文也不变。

条目的强弱不看日历。Agent 用到某条时在回复里写 `[m:<id>]`，这条就升到最高级；同一次查询里排在它前面却没被用上的条目记一次落选，攒够次数降一级，用得越多降得越慢。超过容量时最弱的变成“影子”，仍然查得到，被用上就恢复。你亲口说的和置顶的条目不会被自动淘汰。

同步时两台机器的条目由 `memo` 逐条合并（同一条取后改的），不会出现需要你手工解决的冲突；`docs/` 和 `AGENTS.md` 仍是普通文件，照常走 git。

`AGENTS.md` 只有一份：`~/.claude/CLAUDE.md` 只留一行 `@~/.agents/geispec/AGENTS.md`，`~/.codex/AGENTS.md` 链接到同一个文件。

每台机器装好插件后在终端运行一次（需要 Node.js 22.13 以上；会逐项显示要改什么，确认后才改）。Codex 的 memo 工具也由这一步注册到 `~/.codex/config.toml`：

```shell
node <gei>/bin/gei.mjs memo setup <你的私有仓库地址>
```

终端里的 `memo` 命令包含全部工具，另有 `memo pin`、`memo restore`、`memo review`（列出从未用过的、疑似重复的、反复查不到的词）、`memo log`（某次会话送达和引用了哪些条目）、`memo sync`。手动整理用 `/gei:memo tidy`。详见[使用说明](docs/spec.md)。

<br>

## 致谢与许可

- [superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)
- deslop 改编自 Damir Sokolovsky 的 [unslop](https://github.com/heydamir/unslop)，`skills/deslop/` 沿用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

以 [MIT](LICENSE) 开源。更新记录见 [CHANGELOG.md](CHANGELOG.md)。
