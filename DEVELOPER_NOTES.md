# Watchtower 开发说明文档

> 本文档面向后续接手的开发人员，说明项目架构、关键模块和注意事项。

---

## 1. 项目背景

Watchtower 是一个 Obsidian 插件，提供**文件完整性监控**和**最近打开文件**功能。

本项目曾包含"插件管理"功能，但已于 2026-07 拆分为独立插件 **Plugin Manager**（位于 `.obsidian/plugins/PluginManager/`）。拆分后 Watchtower 仅保留文件监控相关功能。

---

## 2. 项目结构

```
src/
├── main.ts                  # 插件入口（Plugin 子类）
├── types.ts                 # 类型定义 + 默认值
├── store.ts                 # Redux 状态管理（@reduxjs/toolkit）
├── selectors.ts             # Reselect 记忆化选择器
├── FileService.ts           # 配置文件读写服务（单例）
├── types/
│   └── css.d.ts             # CSS 模块类型声明
├── setting/                 # 设置页面
│   ├── settingTab.tsx        # PluginSettingTab（React 渲染）
│   ├── settingTab.css
│   └── components/
│       ├── Switch.tsx        # 开关组件
│       ├── Switch.css
│       └── inputList.tsx     # 多行输入列表组件
└── watchtowerPlugin/        # 核心功能模块
    ├── WatchtowerMian.ts     # 主控制器（事件监听、初始化）
    ├── toolsFC.ts            # 工具函数（loadSettings, init, activateView）
    ├── fileHandler.ts        # 文件读写处理器
    ├── view/
    │   ├── leafView.tsx       # ItemView 注册（文件监控侧边栏）
    │   ├── fileSupervisionView.tsx  # 文件监控主视图
    │   └── statusBarView.tsx  # 底部状态栏视图
    └── recentFile/
        └── RecentOpenFileTable.tsx  # 最近打开文件表格
```

---

## 3. 核心模块说明

### 3.1 main.ts — 插件入口

`WatchtowerPlugin extends Plugin` 是 Obsidian 插件的标准入口。

**生命周期：**
- `onload()` → 加载设置 → 初始化 FileService → 读取 file_state.json → 同步到 Redux → 注册视图和状态栏
- `onunload()` → 清理视图和状态栏 React Root
- `onExternalSettingsChange()` → 重新加载设置和数据

**注意：** `settings`、`fileSupervision`、`fileHandler` 使用 `!` 断言，因为它们在 `onload()` 中异步初始化而非构造函数中。

### 3.2 types.ts — 类型定义

| 类型 | 用途 |
|------|------|
| `SettingsFileStats` | 单个文件的状态信息（路径、大小、差异标记等） |
| `FileSupervisionData` | file_state.json 的完整数据结构 |
| `WatchtowerSettings` | 插件设置（存储在 data.json） |
| `RecentOpenFile` | 最近打开的历史文件记录 |
| `ConfigFileMap` / `ConfigFileName` | 配置文件类型映射（用于类型安全的文件读写） |

**关键常量：**
- `DEFAULT_SETTINGS` — data.json 的默认设置
- `FILE_STATE_DATA` — file_state.json 的默认数据
- `CONFIG_FILES` — 配置文件名映射

### 3.3 store.ts — Redux 状态管理

使用 `@reduxjs/toolkit` 的 `configureStore` + `createSlice`。

**两个 Slice：**

| Slice | 状态 | 主要 Reducers |
|-------|------|--------------|
| `settings` | `WatchtowerSettings`（data.json） | `updataSettings`（全量合并）, `updataFileStats`（仅更新 fileStats） |
| `fsState` | `FileSupervisionData`（file_state.json） | `updataFSstates`（全量合并）, `updataFsFileStats`, `updataFsMarkTime`, `updataField`（字段级更新） |

**注意：** `updataSettings` 是浅合并（`{ ...state, ...action.payload }`），不是深合并。传入的 payload 会覆盖同名顶层字段。

### 3.4 selectors.ts — 记忆化选择器

使用 `reselect` 库的 `createSelector`，避免不必要的重复计算：

- `getNormalizedExcludeSuffixes` — 标准化排除后缀列表（小写 + trim）
- `getFilteredFileStats` — 过滤后的文件列表（排除已删除、未找到、和排除后缀的文件）

### 3.5 FileService.ts — 配置文件服务

**单例模式**，通过 `FileService.getInstance(plugin)` 初始化。

- 负责读写插件目录下的 JSON 配置文件（如 file_state.json）
- 路径构建：`<vault>/.obsidian/plugins/watchtower/<fileName>`
- 提供 `createOrUpdateFile`、`readFile`、`deleteFile`、`fileExists`、`listFiles` 方法

### 3.6 watchtowerPlugin/ — 核心功能

| 文件 | 职责 |
|------|------|
| `WatchtowerMian.ts` | 注册文件变更监听器（`vault.on('modify')`、`vault.on('delete')` 等），驱动文件状态更新 |
| `toolsFC.ts` | `loadSettings()` 加载 data.json；`init()` 初始化文件监控；`activateView()` 打开侧边栏视图 |
| `fileHandler.ts` | 文件信息的读取和保存，计算文件差异（新增/修改/删除/未变化） |
| `view/leafView.tsx` | `ItemView` 子类，注册视图类型 `file-supervision-left-view` |
| `view/fileSupervisionView.tsx` | 文件监控主视图（React 组件），展示文件列表和差异状态 |
| `view/statusBarView.tsx` | 底部状态栏（React 组件），显示差异文件数量，右键菜单可打开历史文件 |
| `recentFile/RecentOpenFileTable.tsx` | 最近打开文件列表视图 |

---

## 4. 数据流

```
data.json ──loadSettings──▶ plugin.settings ──dispatch──▶ Redux store.settings
                                                        │
file_state.json ──readFile──▶ plugin.fileSupervision ──dispatch──▶ Redux store.fsState
                                                                    │
用户操作 ──dispatch──▶ Redux reducer ──▶ plugin.saveData() ──▶ data.json 持久化
```

**关键模式：** 所有状态变更先 dispatch 到 Redux（立即更新 UI），再调用 `plugin.saveData()` 持久化到磁盘。

---

## 5. 构建与开发

```bash
# 安装依赖
npm install

# 开发模式（监听变化自动编译）
npm run dev

# 生产构建（类型检查 + 编译 + 压缩）
npm run build
```

**构建工具链：**
- **TypeScript** 4.7.4 — 类型检查（`tsc -noEmit -skipLibCheck`）
- **esbuild** — JS 打包（src/main.ts → main.js）+ CSS 打包（main.css → styles.css）
- **React 19** + **react-dom/client** — UI 渲染（使用 `createRoot` API）

**CSS 构建注意：** esbuild.config.mjs 中有两个独立的构建步骤：
1. JS 打包：`src/main.ts` → `main.js`
2. CSS 打包：`main.css` → `styles.css`（通过 CSS 插件在 onEnd 中触发）

修改 CSS 源文件后需要确保 `main.css` 中的 `@import` 路径正确。

---

## 6. 注意事项

### 6.1 设置数据的向后兼容

`WatchtowerSettings` 曾经包含插件管理相关字段（`pluginManager`、`pluginGroups` 等）。拆分后这些字段已从类型定义中移除，但**用户的 data.json 中可能仍残留这些旧字段**。`Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` 会忽略多余字段，不会报错，但旧数据不会被清理。

### 6.2 file_state.json 的特殊性

`file_state.json` 不存储在 data.json 中，而是作为独立文件保存在插件目录下。通过 `FileService` 读写，不走 Obsidian 的 `loadData()`/`saveData()` 机制。

### 6.3 全局 app 对象

部分代码通过 `@ts-ignore` 访问全局 `app` 对象（如 `app.vault`、`app.workspace`）。这是 Obsidian 插件开发的常见模式，但 TypeScript 不识别，需要 `@ts-ignore`。

### 6.4 React 渲染

视图组件使用 React 19 + `createRoot` API。在 `onunload()` 中必须调用 `root.unmount()` 清理 React 树，否则会导致内存泄漏。

### 6.5 功能开关

`settings.watchtowerPlugin` 控制文件监控功能的整体开关。设为 `false` 时，`WatchtowerMain` 不会初始化，视图也不会注册。**重启 Obsidian 生效**。

### 6.6 与 Plugin Manager 插件的关系

两个插件完全独立，没有代码级依赖。唯一的关联：

- 共享同一个 Obsidian 仓库（vault）
- 用户可能同时启用两个插件
- 各自有独立的 data.json 和 file_state.json

---

## 7. 已知技术债

1. **main.css 包含已拆分功能的 CSS** — `main.css` 中仍残留插件管理相关的样式（`.PluginManagerView`、`.GroupView` 等），不影响功能但属于无用代码，可手动清理
2. **拼写不一致** — 部分函数/文件名存在拼写问题（如 `updataSettings` 应为 `updateSettings`，`WatchtowerMian` 应为 `WatchtowerMain`，`toolsFC` 含义不明确），修改时需全局搜索替换
3. **Redux store 的 `declare module` 扩展** — `store.ts` 中有 `declare module "react-redux"` 的类型扩展，引用了 `WatchtowerSettings`，如果类型变更需同步更新
4. **eslint 配置重复** — 项目中同时存在 `.eslintrc`（旧格式）和 `eslint.config.mjs`（新 flat config 格式），可能产生冲突
