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

### lark-practice-doc

飞书/Lark 课堂实战文档 skill，用于创建、改写、整理实战练习、课堂练习、实战营、Coze 插件/工作流/智能体教程等操作型文档。

核心输出：

- 严格四列表格任务单
- 真实 Lark 截图区块
- 参数速查、验证样例和排查清单

目录：

```text
lark-practice-doc/
```

### mx-auto

本地 Runtime 自动化入口 skill，用于触发器、只读浏览器沙箱检查，以及本地脚本执行。

支持能力：

- Triggers：列出和运行本地 Runtime triggers
- Sandbox：只读查看 browser sandbox tabs / snapshot
- Scripts：列出、查看和运行本地 App scripts

目录：

```text
mx-auto/
```

## 使用 npx 交互安装

推荐使用 `npx` 按需安装：

```bash
npx skills-yiming
```

安装器会列出当前仓库中的三个 skills，你可以输入：

- `all` 或直接回车：安装全部 skills
- 单个编号：只安装一个 skill
- 逗号分隔编号：安装多个 skills，例如 `1,3`

默认安装位置：

```text
$CODEX_HOME/skills
```

如果没有设置 `CODEX_HOME`，会安装到：

```text
~/.codex/skills
```

安装时会覆盖目标目录下的同名 skill。安装完成后，请重启 Codex 或你的 coding agent 客户端，让新 skill 生效。

## 如何安装单个 skill

下面这个命令只会安装你指定的子目录，不会把整个仓库作为一个 skill 安装。

如果你的环境支持从 GitHub 子目录安装 skill，可以直接使用下面这些地址：

```text
https://github.com/yiming1001/skills-yiming/tree/main/web-collection
https://github.com/yiming1001/skills-yiming/tree/main/lark-practice-doc
https://github.com/yiming1001/skills-yiming/tree/main/mx-auto
```

例如，只安装 `web-collection`：

```bash
python3 <skill-installer-path>/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/web-collection
```

安装结果默认会落到：

```text
<skills-root>/web-collection
```

如果以后这个仓库里有更多 skills，也可以继续按同样方式安装单个目录：

```bash
python3 <skill-installer-path>/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/<skill-directory>
```

例如，只安装 `mx-auto`：

```bash
python3 <skill-installer-path>/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/mx-auto
```

例如，只安装 `lark-practice-doc`：

```bash
python3 <skill-installer-path>/install-skill-from-github.py \
  --url https://github.com/yiming1001/skills-yiming/tree/main/lark-practice-doc
```

其中：

- `<skill-installer-path>` 表示你的 `install-skill-from-github.py` 所在目录
- `<skills-root>` 表示你的 coding agent 本地 skills 根目录

## 手动下载安装

如果你不想走安装脚本，也可以手动下载单个 skill 目录，再放进你本地的 skills 根目录。

以 `<skill-directory>` 为例：

1. 从这个仓库下载对应 skill 目录里的全部文件
2. 在你的本地 skills 根目录下，新建目录：

```text
<skills-root>/<skill-directory>
```

3. 把该 skill 目录下的全部文件放进去
4. 保持目录结构不变，尤其是 `scripts/`、`references/`、`agents/` 等子目录
5. 重启你的 coding agent 或对应客户端，让新 skill 生效

手动安装时，最重要的是目标目录里必须保留 `SKILL.md`，并且相关脚本文件要和仓库里的相对路径一致。

## 安装前提

- 使用 `npx skills-yiming` 时，本机需要 Node.js / npm，并且可以访问 npm registry
- 使用 GitHub 子目录安装时，你的 coding agent 环境需要支持 OpenAI Skills / `skill-installer`
- 手动安装时，只需要能下载 GitHub 仓库内容并写入本地 skills 根目录

安装完成后，重启你的 coding agent 或对应客户端，让新 skill 生效。
