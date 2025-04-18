/* eslint-disable no-mixed-spaces-and-tabs */
import { TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import WatchtowerPlugin from "../main";
import { VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";
import { DEFAULT_SETTINGS, SettingsFileStats } from "../types";
import { store, setSettings } from "../store";

// 注册文件事件处理程序
export function registerFileEventHandlers(plugin: WatchtowerPlugin) {
	const fileEventHandler = async (
		event: string,
		file: TAbstractFile,
		oldPath?: string
	) => {
		// console.log("文件事件：", event, file);
		if (!(file instanceof TFile) || !file) return;
		const state = store.getState();
		let newSettings = state.settings;
		if (event === "opened") {
			const fileStatLists = newSettings.fileStats;
			const updatedFileStats = fileStatLists.map((fileStat) => {
				if (fileStat.path === file.path) {
					return {
						...fileStat,
						recentOpen: new Date().getTime(),
					};
				}
				return fileStat;
			});
			newSettings = {
				...newSettings,
				fileStats: updatedFileStats,
			};
		}
		if (event === "created") {
			const fileStatLists = newSettings.fileStats;
			const addfile = fileStatLists.find(
				(fileStat) => fileStat.path === file.path
			);
			if (!addfile) {
				// 创建新的数组并添加新文件信息
				const updatedFileStats = [
					...fileStatLists,
					{
						basename: file.basename,
						extension: file.extension,
						name: file.name,
						path: file.path,
						stat: {
							size: file.stat.size,
							ctime: file.stat.ctime,
							mtime: file.stat.mtime,
						},
						differents: "新建文件",
						recentOpen: 0,
					} as SettingsFileStats,
				];
				newSettings = {
					...newSettings,
					fileStats: updatedFileStats,
				};
			}
		}
		if (event === "modified") {
			// 找到 path 匹配的对象
			const fileStatLists = newSettings.fileStats;
			const updatedFileStats = fileStatLists.map((fileStat) => {
				if (fileStat.path === file.path) {
					if (file.stat.size !== fileStat.stat.size) {
						if (file.stat.size !== fileStat.stat.size) {
							return {
								...fileStat,
								differents:
									fileStat.differents != "新建文件"
										? file.stat.size > fileStat.stat.size
											? `增加${
													file.stat.size -
													fileStat.stat.size
											  }字节`
											: file.stat.size <
											  fileStat.stat.size
											? `减少${
													fileStat.stat.size -
													file.stat.size
											  }字节`
											: ""
										: fileStat.differents,
							};
						}
					}
				}
				return fileStat;
			});
			newSettings = {
				...newSettings,
				fileStats: updatedFileStats,
			};
		}
		if (event === "deleted") {
			const fileStatLists = newSettings.fileStats;
			const updatedFileStats = fileStatLists.map((fileStat) => {
				if (fileStat.path === file.path) {
					return {
						...fileStat,
						differents: "已删除",
					};
				}
				return fileStat;
			});
			newSettings = {
				...newSettings,
				fileStats: updatedFileStats,
			};
		}
		if (event === "renamed") {
			const fileStatLists = newSettings.fileStats;
			const updatedFileStats = fileStatLists.map((fileStat) => {
				if (fileStat.path === oldPath) {
					return {
						...fileStat,
						differents: `路径：${oldPath} → ${file.path}`,
						path: file.path,
						name: file.name,
						stat: file.stat,
						recentOpen: fileStat.recentOpen,
						basename: file.basename,
						extension: file.extension,
					};
				}
				return fileStat;
			});
			newSettings = {
				...newSettings,
				fileStats: updatedFileStats,
			};
		}
		store.dispatch(setSettings(newSettings));
		// await plugin.saveData(newSettings);
	};

	plugin.registerEvent(
		// 订阅文件的增删改查事件
		plugin.app.vault.on("modify", (file: TAbstractFile) =>
			fileEventHandler("modified", file)
		)
	);
	plugin.registerEvent(
		plugin.app.vault.on("delete", (file: TAbstractFile) =>
			fileEventHandler("deleted", file)
		)
	);
	plugin.registerEvent(
		plugin.app.vault.on("rename", (file: TAbstractFile, oldPath: string) =>
			fileEventHandler("renamed", file, oldPath)
		)
	);
	plugin.registerEvent(
		plugin.app.vault.on("create", (file: TAbstractFile) =>
			fileEventHandler("created", file)
		)
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
	plugin.registerEvent(
		//@ts-ignore 注册配置文件事件处理器
		plugin.app.vault.on("raw", (file: TAbstractFile | null) => {
			if (file) {
				fileEventHandler("raw", file);
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
/** 初始化 */
export async function init(plugin: WatchtowerPlugin) {
	// 比较文件差异
	const differentFiles = plugin.fileHandler.compareFiles();
	const newSettings = {
		...plugin.settings,
		fileStats: differentFiles,
	};
	store.dispatch(setSettings(newSettings));
}
