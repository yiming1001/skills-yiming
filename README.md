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

## 一键安装这个指定 skill

如果你已经在使用支持 `$skill-installer` 的 Codex / OpenClaw 环境，可以直接让代理执行下面这句：

```text
$skill-installer install https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

或者使用对应的 GitHub 路径作为安装源，只安装这个 `web-collection` skill，而不是整个仓库。

安装完成后，重启 Codex 让新 skill 生效。
