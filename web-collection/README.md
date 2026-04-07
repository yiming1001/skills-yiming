# web-collection

`web-collection` 是一个网页采集 skill。

它通过本地 bridge 和浏览器插件工作，适合在你自己的正常 Chrome 环境里执行采集任务，而不是依赖隔离浏览器环境。

## 这个 skill 提供什么能力

- 通过本地 bridge + 浏览器插件执行采集
- 优先复用真实连接器流程
- 自动检查默认配置是否完整
- 用同步闭环方式发起任务、轮询状态并处理导出结果
- 支持按平台选择默认 method

## 适用平台

- Douyin
- TikTok
- Xiaohongshu
- Amazon
- Bilibili

## 核心文件

- `SKILL.md`
- `scripts/run.sh`
- `scripts/export_preference.sh`
- `scripts/collect_and_export_loop.sh`

## 安装这个 skill

只安装这个 `web-collection` skill：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

默认安装目录：

```text
~/.codex/skills/web-collection
```

## 安装前提

- 你使用的 coding agent 环境支持 OpenAI Skills / `skill-installer` 这套安装方式
- 环境里可以访问或调用 `install-skill-from-github.py`
- 本机可以运行 `python3`
- 本机可以访问 GitHub

安装完成后，重启你的 coding agent 或对应客户端，让新 skill 生效。
