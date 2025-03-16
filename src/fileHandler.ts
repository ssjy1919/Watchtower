import { App } from "obsidian";
import {
	WatchtowerSettings,
	SettingsFileStats,
	settingsFileStats,
} from "./types";
import {
	store,
	setFileStatList,
	setFileChange,
	setDifferentFiles,
    setSettings,
} from "./store";
import WatchtowerPlugin from "./main";

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

		// 将 settings.fileStats 转换为 Map，提高查找效率
		const fileStatsMap = new Map(
			this.settings.fileStats.map((file) => [file.path, file])
		);

		// 从 Redux 状态中获取 fileStatList
		const state = store.getState();
		const fileStatLists = state.counter.fileStatList;

		// 遍历文件列表，收集所有文件的信息
		const filesInfo = markdownFiles.map((file) => {
			// 使用 settingsFileStats 提供的默认值
			const fileStat = fileStatsMap.get(file.path) || settingsFileStats;

			// 从 fileStatLists 中查找对应路径的记录
			const fileStatListEntry = fileStatLists.find(
				(f) => f.path === file.path
			);

			return {
				basename: file.basename,
				extension: file.extension,
				name: file.name,
				path: file.path,
				stat: file.stat,
				differents:
					fileStatListEntry?.differents || fileStat.differents || "",
				recentOpen:
					fileStatListEntry?.recentOpen || fileStat.recentOpen || 0,
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
		const fileStatLists = this.settings.fileStats
			.map((settingFile) => {
				const currentFile = currentFiles.find(
					(file) => file.path === settingFile.path
				);
				if (!currentFile) {
					return { ...settingFile, differents: "文件丢失" };
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
				return;
			})
			.filter(Boolean) as SettingsFileStats[];

		const missingFiles = currentFiles
			.map((currentFile) => {
				if (
					!this.settings.fileStats.find(
						(settingFile) => settingFile.path === currentFile.path
					)
				) {
					return { ...currentFile, differents: "新增文件" };
				}
				return;
			})
			.filter(Boolean) as SettingsFileStats[];

		return [...fileStatLists, ...missingFiles];
	}

	/** 更新markTime为当前时间的本地化字符串，同时将fileStats替换为传入的参数 */
	createUpdatedSettings(fileStats: SettingsFileStats[]): WatchtowerSettings {
		return {
			...this.plugin.settings,
			markTime: new Date().toLocaleString(),
			fileStats: fileStats,
		};
	}

	/** 通过 Redux 的 dispatch 方法将数据更新到全局状态中 */
	updateState(
		fileStats: SettingsFileStats[],
		differentFiles: SettingsFileStats[]
	): void {
		store.dispatch(setFileStatList(fileStats));
        store.dispatch(setDifferentFiles(differentFiles));
        this.settings.markTime= new Date().toLocaleString();
        store.dispatch(setSettings(this.settings));
		store.dispatch(setFileChange(true));
	}
	/** 保存文件信息到插件存储的异步函数。 */
	saveFileInfo = async (): Promise<void> => {
		const fileStatList = store.getState().counter.fileStatList;
		// 更新设置
		const updatedSettings = this.createUpdatedSettings(fileStatList);
		// 同步更新 this.settings.fileStats
		this.settings.fileStats = updatedSettings.fileStats;
		// 加载文件信息
		const fileStats = this.loadFileStats();

		// 比较文件信息
		const differentFiles = this.compareFiles();

		// 保存数据到插件存储
		await this.plugin.saveData(updatedSettings);
		// 更新状态管理
		this.updateState(fileStats, differentFiles);
	};
}
