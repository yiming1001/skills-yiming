# skills-yiming

这是一个个人 skill 仓库。

这个仓库本身是总目录，每个 skill 都放在自己的子目录里。安装时按子目录安装，所以你可以只装其中一个 skill，不需要把整个仓库都装进去。

## 当前可用的 skills

### web-collection

网页采集 skill，基于本地 bridge 和浏览器插件执行同步闭环采集。

支持的平台：

- Douyin
- TikTok
- Xiaohongshu
- Amazon
- Bilibili

目录：

```text
web-collection/
```

详情说明：

```text
web-collection/README.md
```

## 如何安装单个 skill

下面这个命令只会安装你指定的子目录，不会把整个仓库作为一个 skill 安装。

例如，只安装 `web-collection`：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

安装结果默认会落到：

```text
~/.codex/skills/web-collection
```

如果以后这个仓库里有更多 skills，也可以继续按同样方式安装单个目录：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/<skill-directory>
```

## 安装前提

- 你使用的 coding agent 环境支持 OpenAI Skills / `skill-installer` 这套安装方式
- 环境里可以访问或调用 `install-skill-from-github.py`
- 本机可以运行 `python3`
- 本机可以访问 GitHub

安装完成后，重启你的 coding agent 或对应客户端，让新 skill 生效。
