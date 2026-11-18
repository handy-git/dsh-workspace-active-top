# dsh-workspace-active-top

发消息时，把**当前工作区**顶到它在侧边栏所属分区（置顶 / 项目）的最前面。

## 功能

- 触发时机：你发出消息（Host 事件 `api-session/activity`）
- 作用对象：**工作区**，不是会话
- 作用范围：只在工作区**所在的那个分区内**排序，不会跨分区乱窜
  - 置顶区的工作区只在置顶区里上浮
  - 项目区的工作区只在项目区里上浮
- 不会把工作区"扔到全局最顶部"，也不会破坏 codex 侧边栏的分组

## 与 `dsh-session-active-top` 的区别

| | dsh-session-active-top | 本插件 |
|---|---|---|
| 作用对象 | 工作区**内部**的会话列表 | **工作区本身**（分区内） |
| 触发 | 会话进入 running | 用户发消息 |
| 位置 | 纯 client 半边 | 纯 Host 半边 |
| 状态 | localStorage | workspaceRegistry + sections 文件 |

两者层级不同，**可以同时安装，互不冲突**：一个排会话，一个排工作区。

## 原理

1. `workspaceRegistry.list()` 找到包含该 session 的工作区
2. 读取 codex-ui 的分区文件 `plugin-data/michengai.dsh-codex-ui/workspace-sections.json`
3. 若工作区已在某分区且不是首位：把它移到该分区 `ids[0]`，原子写回（临时文件 + rename）
4. 再调用 `workspaceRegistry.insertBefore(workspace.id, 同分区第一个兄弟)`，让 registry 顺序与分区顺序一致
5. 工作区不在任何分区、或分区文件不存在时：兜底移到全部工作区最前

## 安装

```bash
dsh plugin --profile web add /path/to/dsh-workspace-active-top
```

或在 Harness 里用 `plugin_manager` 的 `install_bundle` 指向本目录。

替换已安装版本时：先 `remove_bundle`，再 `install_bundle`（直接 install 会报 already-installed）。

## 已知风险

- **直写 codex-ui 的私有数据文件**：`workspace-sections.json` 属于 `@michengai/dsh-codex-ui`，不是公开 API。格式若变更，本插件会静默失效（写入失败被 `catch {}` 吞掉），并退化到"移到全局最前"
- 与 codex-ui 自身写该文件存在竞态，最后写入者生效（概率低）
- 只对装了 codex 侧边栏的环境有意义

## 许可

MIT
