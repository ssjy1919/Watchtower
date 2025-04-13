import { App, Notice } from "obsidian";
import {
	WatchtowerSettings,
	SettingsFileStats,
	settingsFileStats,
} from "../types";
import WatchtowerPlugin from "../main";
import { setSettings, store } from "src/store";

export class FileHandler {
	app: App;
	settings: WatchtowerSettings;
	plugin: WatchtowerPlugin;

	constructor(
		app: App,
		settings: WatchtowerSettings,
		plugin: WatchtowerPlugin
	) {
		this.app = app;
		this.settings = settings;
		this.plugin = plugin;
	}

	/**
	 * 获取文件信息
	 * 获取所有 Markdown 文件的路径和状态信息如果找不到任何文件，
	 * 则返回一个包含空路径和默认状态值的对象数组此函数主要用于获取文件的基本信息
	 *
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	loadFileStats(): SettingsFileStats[] {
		// 获取所有 Markdown 文件
		const markdownFiles = this.app.vault.getMarkdownFiles();

		// 将 settings.fileStats 转换为 Map，提高查找效率，得到 [{path:fileStat}]
		const fileStats = store.getState().settings.fileStats;
		const fileStatsMap = new Map(
			fileStats.map((file) => [file.path, file])
		);
		// 遍历文件列表，收集所有文件的信息
		const filesInfo = markdownFiles.map((file) => {
			// 找不到就使用 settingsFileStats 提供的默认值
			const fileStat = fileStatsMap.get(file.path) || settingsFileStats;
			return {
				basename: file.basename,
				extension: file.extension,
				name: file.name,
				path: file.path,
				stat: file.stat,
				differents: fileStat.differents,
				recentOpen: fileStat.recentOpen,
			} as SettingsFileStats;
		});
		// 如果没有找到文件，返回一个空数组
		return filesInfo.length > 0 ? filesInfo : [settingsFileStats];
	}
	/**
	 * 对比 getSettingInfo() 和 getFileInfo() 得到的数据
	 * 以 getSettingInfo() 的 path 为数据 id，对比它们的 stat，返回不相同的数据
	 *
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	compareFiles(): SettingsFileStats[] {
		const currentFiles = this.loadFileStats();
		const fileStats = store.getState().settings.fileStats;
		const fileStatLists = fileStats
			.map((settingFile) => {
				const currentFile = currentFiles.find(
					(file) => file.path === settingFile.path
				);
				if (!currentFile) {
					return {
						...settingFile,
						differents:
							settingFile.differents === "已删除"
								? "已删除"
								: "未找到",
					};
				}
				if (settingFile.stat.size !== currentFile.stat.size) {
					if (settingFile.stat.size > currentFile.stat.size) {
						return {
							...settingFile,
							differents: `减少${
								settingFile.stat.size - currentFile.stat.size
							} 字节`,
						};
					} else if (settingFile.stat.size < currentFile.stat.size) {
						return {
							...settingFile,
							differents: `增加${
								currentFile.stat.size - settingFile.stat.size
							} 字节`,
						};
					}
				}
				return; //不符合条件的数据由 missingFiles 返回即可，避免数据翻倍
			})
			.filter(Boolean) as SettingsFileStats[];

		const missingFiles = currentFiles
			.map((currentFile) => {
				if (
					!this.settings.fileStats.find(
						(settingFile) => settingFile.path === currentFile.path
					)
				) {
					return { ...currentFile, differents: "新建文件" };
				}
				return currentFile;
			})
			.filter(Boolean) as SettingsFileStats[];

		// 合并并去重
		const combinedFiles = [...fileStatLists, ...missingFiles];
		const uniqueFiles = Array.from(
			new Map(combinedFiles.map((item) => [item.path, item])).values()
		);

		return uniqueFiles;
	}
	/** 保存文件信息到插件存储，并刷新文件差异信息。 */
	saveFileInfo = async (): Promise<void> => {
		try {
			// 加载文件信息
			const fileStats = this.loadFileStats();
			// 遍历 fileStats 并将 differents 设置为空字符串
			const updatedFileStats = fileStats.map((file) => ({
				...file,
				differents: "",
			}));
			const newSettings = {
				...store.getState().settings,
				fileStats: updatedFileStats,
				markTime: new Date().toLocaleString(),
			};
			store.dispatch(setSettings(newSettings));
			await this.plugin.saveData(newSettings);
		} catch (error) {
			console.error("保存文件信息失败：", error);
			new Notice("保存文件信息失败，请检查控制台日志。");
		}
	};
}
