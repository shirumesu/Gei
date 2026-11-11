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
/plugin install gei@gei-claude
```

</details>

<details>
<summary><b>其他支持 Skills 的工具</b></summary>

下载 [Gei-skills.zip](https://github.com/shirumesu/gei/releases/latest/download/Gei-skills.zip)，解压到工具读取 Skills 的目录；或者直接 clone，之后用 `git pull` 更新：

```shell
git clone https://github.com/shirumesu/gei.git <skills-dir>/Gei
```

这种方式只有 Skills，不包含 Hooks 和 `gei memo` 命令。

</details>

<br>

## 组成

### Skills

| Skill | 做什么 |
| --- | --- |
| consider | 动手前判断值不值得做、怎么做、会锁定什么 |
| memo | 用纯 Markdown 记下代码里找不到的东西：你的偏好和纠正、反复出现的做法和坑、可以复用的已有代码的位置。放在一个 git 仓库里，跨机器、跨 Agent 共用 |
| diagnose | 先拿到能复现的命令，找到根因再修 |
| inspect | 用新上下文的子代理对照原始需求审查改动，需手动调用 |
| deslop | 给已有设计语言的产品去掉“AI 味”：逐页审查粗体小字、无意义的彩色、闪光图标、重复的状态和不齐的间距，你逐条选，只改选中的并同步设计文档 |

### Hooks

| 时机 | 做什么 |
| --- | --- |
| 会话开始 | 同步记忆库（提交本地改动、拉取、推送），检查格式和预算，注入用途说明、跨项目索引、当前项目索引和复用指针 |
| 每轮回复结束 | 记忆库有改动时提交、拉取、推送；失败会显示出来 |

### 记忆

记忆是 `~/.agents/geispec` 下的一个 git 仓库，建议克隆你自己的私有仓库；Agent 直接用自带的文件工具读写，不需要在项目里加任何文件：

```text
AGENTS.md                      你的长期指令，由 Claude Code 和 Codex 自己加载
context/MEMORY.md              跨项目记忆的索引，会话开始时注入
context/<topic>.md             一个主题
projects/<project>/MEMORY.md   当前项目记忆的索引，会话开始时注入
projects/<project>/<topic>.md  一个主题
projects/<project>/MAP.md      复用指针，整份注入
```

都是普通 Markdown，在编辑器或 GitHub 上可以直接读、直接改。索引每行 `- [主题](主题.md) - 什么时候读`，规则本身只写在主题文件里，带原因（Why）和用法（How to apply）。偏好先记在项目里，你说“所有项目都这样”或在另一个项目里再次出现时才进 `context/`。`MAP.md` 每行一个指针 `- 需要 X 时 → 路径#符号: 一句话约定`，会话开始时逐条检查文件和符号还在不在，失效的不注入。注入总量有硬预算（100 行、8,000 字符）。

`AGENTS.md` 只有一份：`~/.claude/CLAUDE.md` 只留一行 `@~/.agents/geispec/AGENTS.md`，`~/.codex/AGENTS.md` 链接到同一个文件。

每台机器装好插件后在终端运行一次（会逐项显示要改什么，确认后才改）：

```shell
node <gei>/bin/gei.mjs memo setup <你的私有仓库地址>
```

另有 `gei memo sync`、`lint`、`trace`（查某次会话注入了什么、读了哪些记忆）。手动整理用 `/gei:memo tidy`。详见[使用说明](docs/spec.md)。

<br>

## 致谢与许可

- [superpowers](https://github.com/obra/superpowers)、[gstack](https://github.com/garrytan/gstack)、[Waza](https://github.com/tw93/waza)
- deslop 改编自 Damir Sokolovsky 的 [unslop](https://github.com/heydamir/unslop)，`skills/deslop/` 沿用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

以 [MIT](LICENSE) 开源。更新记录见 [CHANGELOG.md](CHANGELOG.md)。
