/* eslint-disable no-mixed-spaces-and-tabs */
import { normalizePath, TAbstractFile, WorkspaceLeaf } from "obsidian";
import WatchtowerPlugin from "../main";
import { VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";
import { DEFAULT_SETTINGS, SettingsFileStats } from "../types";
import {
	store,
	updataFsFileStats,
	updataFSstates,
	updataSettings,
} from "../store";
// 注册文件事件处理程序
export function registerFileEventHandlers(plugin: WatchtowerPlugin) {
	const fileEventHandler = async (
		event: string,
		file: TAbstractFile,
		oldPath?: string
	) => {
		const thisFileStat = await plugin.app.vault.adapter.stat(
			normalizePath(file.path)
		);
		const extMatch = file.name.match(/^(.+)\.([^.]+)$/);
		const basename = extMatch ? extMatch[1] : file.name;
		const extension = extMatch ? extMatch[2] : "";
		const state = store.getState();
		let newSettings = state.settings;
		if (event === "opened") {
			const now = new Date().getTime();
			const existingFile = newSettings.recentOpenFile.find(
				(f) => f.path === file.path
			);
			const updataFileStats = newSettings.fileStats.map((fileStat) => {
				if (fileStat.path === file.path) {
					return {
						...fileStat,
						recentOpen: now,
					};
				}
				return fileStat;
			});

			const updatedRecord = existingFile
				? { ...existingFile, recentOpen: now }
				: {
						path: file.path,
						name: file.name,
						basename: basename,
						extension: extension,
						recentOpen: now,
				  };

			const updatedList = existingFile
				? newSettings.recentOpenFile.map((f) =>
						f.path === file.path ? updatedRecord : f
				  )
				: [...newSettings.recentOpenFile, updatedRecord];

			newSettings = {
				...newSettings,
				fileStats: updataFileStats,
				recentOpenFile: updatedList,
			};
		}
		if (event === "created" && thisFileStat) {
			const addfile = newSettings.fileStats.find(
				(fileStat) => fileStat.path === file.path
			);
			if (!addfile) {
				// 创建新的数组并添加新文件信息
				const updataFileStats = [
					...newSettings.fileStats,
					{
						basename: basename,
						extension: extension,
						name: file.name,
						path: file.path,
						stat: {
							size: thisFileStat.size,
							ctime: thisFileStat.ctime,
							mtime: thisFileStat.mtime,
						},
						differents: "新建文件",
						recentOpen: 0,
					} as SettingsFileStats,
				];
				newSettings = {
					...newSettings,
					fileStats: updataFileStats,
				};
			}
		}
		if (event === "modified" && thisFileStat) {
			// 找到 path 匹配的对象
			const updataFileStats = newSettings.fileStats.map((fileStat) => {
				if (fileStat.path === file.path) {
					return {
						...fileStat,
						differents:
							// fileStat.differents != "新建文件" ?
							thisFileStat.size > fileStat.stat.size
								? `增加${
										thisFileStat.size - fileStat.stat.size
								  }字节`
								: thisFileStat.size < fileStat.stat.size
								? `减少${
										fileStat.stat.size - thisFileStat.size
								  }字节`
								: "",
						// : fileStat.differents,
					};
				}

				return fileStat;
			});
			newSettings = {
				...newSettings,
				fileStats: updataFileStats,
			};
		}
		if (event === "deleted") {
			const updataFileStats = newSettings.fileStats.map((fileStat) => {
				if (fileStat.path === file.path) {
					return {
						...fileStat,
						differents: "已删除",
					};
				}
				return fileStat;
			});
			const updataRecentOpen = newSettings.recentOpenFile.filter(
				(recentOpenFile) => recentOpenFile.path !== file.path
			);
			newSettings = {
				...newSettings,
				fileStats: updataFileStats,
				recentOpenFile: updataRecentOpen,
			};
		}
		if (event === "renamed" && thisFileStat) {
			const updataFileStats = newSettings.fileStats.map((fileStat) => {
				if (fileStat.path === oldPath) {
					return {
						...fileStat,
						differents: `路径：${oldPath} → ${file.path}`,
						path: file.path,
						name: file.name,
						stat: thisFileStat,
						recentOpen: fileStat.recentOpen,
						basename: basename,
						extension: extension,
					};
				}
				return fileStat;
			});
			const updataRecentOpen = newSettings.recentOpenFile.map(
				(recentOpenFile) => {
					if (recentOpenFile.path === file.path) {
						return {
							...recentOpenFile,
							path: file.path,
							name: file.name,
							basename: basename,
							extension: extension,
						};
					}
					return recentOpenFile;
				}
			);
			newSettings = {
				...newSettings,
				fileStats: updataFileStats,
				recentOpenFile: updataRecentOpen,
			};
		}
		store.dispatch(updataSettings(newSettings));
		store.dispatch(updataFsFileStats(newSettings.fileStats));
		await plugin.saveData(newSettings);
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
	store.dispatch(updataFSstates(plugin.fileSupervision));
	store.dispatch(updataSettings(plugin.settings));
	const fileSupervisionFileStats = plugin.fileSupervision.fileStats;
	// 比较文件差异
	const differentFiles = await plugin.fileHandler.compareFiles(
		fileSupervisionFileStats
	);
	const recentOpenFile = plugin.settings.recentOpenFile.filter((r) => {
		const file = plugin.app.vault
			.getAllLoadedFiles()
			.find((f) => f.path === r.path);
		if (r.path === file?.path) return r;
	});
	const finalFileStats = differentFiles.map((file) => {
		const settingFile = plugin.settings.fileStats.find(
			(f) => f.path === file.path
		);
		return {
			...file,
			recentOpen: settingFile?.recentOpen || file.recentOpen,
		};
	});
	const newSettings = {
		...plugin.settings,
		fileStats: finalFileStats,
		recentOpenFile: recentOpenFile,
	};
	store.dispatch(updataFSstates(plugin.fileSupervision));
	store.dispatch(updataSettings(newSettings));
}
