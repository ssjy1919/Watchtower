import { TAbstractFile, WorkspaceLeaf } from "obsidian";
import WatchtowerPlugin from "./main";
import { VIEW_TYPE_FILE_SUPERVISION } from "./watchtowerPlugin/view/leafView";
import { DEFAULT_SETTINGS } from "./types";
import {
	store,
	setFileStatList,
	setRecentOpenFiles,
	setDifferentFiles,
	setSettings,
} from "./store";

// 注册文件事件处理程序
export function registerFileEventHandlers(plugin: WatchtowerPlugin) {
	const fileEventHandler = async (
		event: string,
		file: TAbstractFile,
		oldPath?: string
	) => {
		try {
            const state = store.getState();
            if (event === "opened") {
                // 比较文件信息
				const recentOpenFiles =
                plugin.fileHandler.compareFiles();
				store.dispatch(setRecentOpenFiles(recentOpenFiles));
				if (file?.path) {
                    // 找到 path 匹配的对象
					const fileStatLists = state.counter.fileStatList;
					const updatedFileStats = fileStatLists.map((fileStat) => {
						if (fileStat.path === file.path) {
							// 更新 recentOpen 为当前时间
							return {
								...fileStat,
								recentOpen: new Date().getTime(),
							};
						}
						return fileStat;
					});
					store.dispatch(setFileStatList(updatedFileStats));
				}
			} else if (
				event === "created" ||
				event === "renamed" ||
				event === "modified" ||
				event === "deleted"
			) {
				// 加载文件信息
				const fileStats = plugin.fileHandler.loadFileStats();
                store.dispatch(setFileStatList(fileStats));
                // 比较文件差异
                const differentFiles = plugin.fileHandler.compareFiles();
                store.dispatch(setDifferentFiles(differentFiles));
			}
		} catch (error) {
			console.error(`处理文件事件 ${event} 时出错：`, error);
		}
	};

	// 订阅文件的增删改查事件
	plugin.app.vault.on("modify", (file: TAbstractFile) =>
		fileEventHandler("modified", file)
	);
	plugin.app.vault.on("delete", (file: TAbstractFile) =>
		fileEventHandler("deleted", file)
	);
	plugin.app.vault.on("rename", (file: TAbstractFile, oldPath: string) =>
		fileEventHandler("renamed", file, oldPath)
	);
	plugin.app.vault.on("create", (file: TAbstractFile) =>
		fileEventHandler("created", file)
	);
	// 订阅文件打开事件
	plugin.registerEvent(
		plugin.app.workspace.on("file-open", (file: TAbstractFile | null) => {
			if (file) {
				// 调用文件事件处理器或其他逻辑
				fileEventHandler("opened", file);
			}
		})
	);
}
/** 激活右边视图 */
export async function activateView(plugin: WatchtowerPlugin) {
	if (!plugin.fileHandler) {
		console.warn("fileHandler is not initialized yet, cannot open view.");
		return;
	}
	const { workspace } = plugin.app;

	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);

	if (leaves.length > 0) {
		// 如果视图已存在，直接使用
		leaf = leaves[0];
	} else {
		// 否则创建新的视图
		leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_FILE_SUPERVISION,
				active: true,
			});
		}
	}
	// 确保视图可见
	if (leaf) {
		workspace.revealLeaf(leaf);
	}
}


// 加载用户设置
export async function loadSettings(plugin: WatchtowerPlugin) {
	plugin.settings = Object.assign(
		{},
		DEFAULT_SETTINGS,
		await plugin.loadData()
	);
}
/** 插件启动初始化 */
export async function init(plugin: WatchtowerPlugin) {
	// 加载文件信息
	const fileStatLists = plugin.fileHandler.loadFileStats();
	store.dispatch(setFileStatList(fileStatLists));
	// 比较文件差异
	const differentFiles = plugin.fileHandler.compareFiles();
	store.dispatch(setDifferentFiles(differentFiles));
	store.dispatch(setSettings(plugin.settings));
}
