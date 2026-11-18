# dsh-workspace-active-top

发消息时，当前工作区自动排到侧边栏分区的最前面。

## 功能

- **发消息即置顶**：你在哪个工作区发消息，它就会移到所属分区（置顶 / 项目）的第一位
- **只在分区内排序**：置顶区的工作区留在置顶区，项目区的工作区留在项目区，不会跑到别的分区
- **不打扰分组**：不动 [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) 侧边栏的分组结构，只调整组内顺序
- **重启不丢**：顺序会保存，下次打开还是这个样子

## 适用场景

工作区一多，最近在用的那个总是要往下翻。装上之后，你正在用的工作区永远在自己那组的最上面。

## 安装

```bash
dsh plugin --profile web add https://github.com/<你的仓库>/dsh-workspace-active-top
```

装完即生效，无需配置。

## 说明

分组排序依赖 [dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) 的分区数据。没装它时，工作区会排到全部工作区的最前面。

## 许可

MIT
