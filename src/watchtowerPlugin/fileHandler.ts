import { normalizePath, Notice } from "obsidian";
import { CONFIG_FILES, SettingsFileStats, settingsFileStats } from "../types";
import WatchtowerPlugin from "../main";
import { store, updataFileStats, updataFSstates } from "src/store";
import { FileService } from "src/FileService";

export class FileHandler {
	plugin: WatchtowerPlugin;

	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * 获取所有文件的路径和状态信息，
	 * 如果找不到任何文件，则返回一个包含空路径和默认状态值的对象数组
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	async loadFileStats(
		fileStats: SettingsFileStats[]
	): Promise<SettingsFileStats[]> {
		const state = store.getState();
		const MonitoredFileExcludes = state.settings.MonitoredFileExcludes;
		const storeFiles = fileStats.filter((file) => {
			const extMatch = file.name.match(/\.([^.]+)$/);
			const fileExt = extMatch ? extMatch[1] : "";
			if (fileExt === "" || !MonitoredFileExcludes.includes(fileExt))
				return fileExt === "" || !MonitoredFileExcludes.includes(fileExt);
		});
		const files = this.plugin.app.vault.getAllLoadedFiles().filter((f) => {
			const extMatch = f.name.match(/\.([^.]+)$/);
			const fileExt = extMatch ? extMatch[1] : "";
			return fileExt === "" || !MonitoredFileExcludes.includes(fileExt);
		});
		const fileStatsMap = new Map(
			storeFiles.map((file) => [file.path, file])
		);
		const filesInfoPromise = await files.map(async (file) => {
			const stat = await this.plugin.app.vault.adapter.stat(
				normalizePath(file.path)
			);
			const extMatch = file.name.match(/^(.+)\.([^.]+)$/);
			const basename = extMatch ? extMatch[1] : file.name;
			const extension = extMatch ? extMatch[2] : "";
			const fileStat = fileStatsMap.get(file.path);
			return {
				basename: basename,
				extension: extension,
				name: file.name,
				path: file.path,
				stat: {
					size: stat?.size || 0,
					ctime: stat?.ctime || 0,
					mtime: stat?.mtime || 0,
				},
				differents: fileStat?.differents,
				recentOpen: fileStat?.recentOpen,
			} as SettingsFileStats;
		});
		return Promise.all(filesInfoPromise).then((results) =>
			results.length > 0 ? results : [settingsFileStats]
		);
	}
	/**
	 * 对比 getSettingInfo() 和 getFileInfo() 得到的数据
	 * 以 getSettingInfo() 的 path 为数据 id，对比它们的 stat，返回不相同的数据
	 *
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	async compareFiles(
		fileSupervisionFileStats: SettingsFileStats[]
	): Promise<SettingsFileStats[]> {
		const currentFiles = await this.loadFileStats(fileSupervisionFileStats);
		const fileSupervisionFileStatsLists = fileSupervisionFileStats
			.map((fileSupervisionFile) => {
				const currentFile = currentFiles.find(
					(file) => file.path === fileSupervisionFile.path
				);
				if (!currentFile) {
					return {
						...fileSupervisionFile,
						differents:
							fileSupervisionFile.differents === "已删除"
								? "已删除"
								: "未找到",
					};
				}
				if (fileSupervisionFile.stat.size !== currentFile.stat.size) {
					if (fileSupervisionFile.stat.size > currentFile.stat.size) {
						return {
							...fileSupervisionFile,
							differents: `减少${
								fileSupervisionFile.stat.size -
								currentFile.stat.size
							} 字节`,
						};
					} else if (
						fileSupervisionFile.stat.size < currentFile.stat.size
					) {
						return {
							...fileSupervisionFile,
							differents: `增加${
								currentFile.stat.size -
								fileSupervisionFile.stat.size
							} 字节`,
						};
					}
				}
				return; //不符合条件的数据由 missingFiles 返回即可，避免数据翻倍
			})
			.filter(Boolean) as SettingsFileStats[];

		// 创建原始监控文件路径的 Set
		const supervisionPaths = new Set(
			fileSupervisionFileStats.map((file) => file.path)
		);

		// 检查 currentFile 是否存在于原始监控列表
		const missingFiles = currentFiles
			.map((currentFile) => {
				if (!supervisionPaths.has(currentFile.path)) {
					return { ...currentFile, differents: "新建文件" };
				}
				return currentFile;
			})
			.filter(Boolean) as SettingsFileStats[];
		// 合并并去重
		const combinedFiles = [
			...fileSupervisionFileStatsLists,
			...missingFiles,
		];
		const uniqueFiles = Array.from(
			new Map(
				combinedFiles.map((item) => [
					item.path,
					// 优先保留有 differents 的条目
					item.differents
						? item
						: combinedFiles.find(
								(f) => f.path === item.path && f.differents
						  ) || item, // 如果没有带 differents 的条目，保留当前项
				])
			).values()
		) as SettingsFileStats[];
		/** 通常设置文件里面的 recentOpen 会是最新的时间，所以优先使用设置文件里面的 recentOpen */
		uniqueFiles.forEach((item) => {
			const settingFile = this.plugin.settings.fileStats.find(
				(file) => file.path === item.path
			);
			item.recentOpen = settingFile?.recentOpen || item.recentOpen;
		});

		return uniqueFiles.length > 0 ? uniqueFiles : [];
	}
	/** 保存文件信息到插件存储，并刷新文件差异信息。 */
	saveFileInfo = async (): Promise<void> => {
		try {
			const storeSettingState = store.getState().settings;
			/** 加载当前文件信息 */
			const currentFiles = await this.loadFileStats(
				storeSettingState.fileStats
			);

			// 遍历 fileStats 并将 differents 设置为空字符串
			const updatadFileStats = currentFiles.map((file) => ({
				...file,
				differents: "",
			}));
			const markTime = new Date().toLocaleString();
			const newSettings = {
				...storeSettingState,
				markTime: markTime,
				fileStats: updatadFileStats,
			};
			this.plugin.fileSupervision = {
				markTime: newSettings.markTime,
				fileStats: updatadFileStats,
			};
			// 写入 file_state.json
			FileService.getInstance(this.plugin).createOrUpdateFile(
				CONFIG_FILES.FILE_STATE_DATA,
				this.plugin.fileSupervision
			);
			store.dispatch(updataFSstates(this.plugin.fileSupervision));
			store.dispatch(updataFileStats(updatadFileStats));
			await this.plugin.saveData(newSettings);
		} catch (error) {
			console.error("保存文件信息失败：", error);
			new Notice("保存文件信息失败，请检查控制台日志。");
		}
	};
}
