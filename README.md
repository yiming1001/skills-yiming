# skills-yiming

这个仓库目前只提供一个 skill：

- `web-collection`

## web-collection 是做什么的

`web-collection` 用来通过本地 bridge + 浏览器插件，完成网页内容采集任务。

目前主要面向这些平台：

- Douyin
- TikTok
- Xiaohongshu
- Amazon
- Bilibili

## 这个 skill 能帮你做什么

这个 skill 主要提供一套稳定的采集工作流，而不只是几个零散脚本。

它会帮助你：

- 优先走本地 bridge 和浏览器插件链路
- 使用你平时登录的 Chrome 环境，而不是隔离浏览器环境
- 自动检查采集前置配置是否完整
- 以同步闭环方式执行采集、轮询状态、处理导出结果
- 在 bridge 可用时优先复用真实连接器流程

仓库里的核心内容：

- `web-collection/SKILL.md`
- `web-collection/scripts/run.sh`
- `web-collection/scripts/export_preference.sh`
- `web-collection/scripts/collect_and_export_loop.sh`

## 安装这个 skill

这里分成两种方式：

### 方式 1：让代理帮你安装

如果你已经在支持 `skill-installer` 的 Codex / OpenClaw 环境里，可以直接对代理说：

```text
请用 $skill-installer 安装这个 skill：
https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

这是一句给代理看的指令，不是直接在终端里执行的 shell 命令。

### 方式 2：你自己在终端里执行

真正的安装命令是下面这句：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

这条命令会把 `web-collection` 安装到默认目录：

```text
~/.codex/skills/web-collection
```

### 安装前提

- 你的环境里已经有 Codex，并且自带系统 skill `skill-installer`
- 本机可以运行 `python3`
- 本机可以访问 GitHub
- 这是公开仓库，正常情况下不需要额外凭证

如果你想手动指定安装目录，也可以这样：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection \
  --dest /your/project/skills
```

安装完成后，重启 Codex，让新 skill 生效。
