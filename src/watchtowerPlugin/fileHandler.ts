import { App } from "obsidian";
import {
	WatchtowerSettings,
	SettingsFileStats,
	settingsFileStats,
} from "./types";
import {
	store,
	setDifferentFiles,
	setFileStatList,
	setFileChange,
} from "./store";
import WatchtowerPlugin from "../main";

export class FileHandler {
	private app: App;
	private settings: WatchtowerSettings;
	private plugin: WatchtowerPlugin;

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
	getFileInfo(): SettingsFileStats[] {
		// 获取所有 Markdown 文件
		const markdownFiles = this.app.vault.getMarkdownFiles();

		// 将 settings.fileStats 转换为 Map，提高查找效率
		const fileStatsMap = new Map(
			this.settings.fileStats.map((file) => [file.path, file])
		);

		// 遍历文件列表，收集所有文件的信息
		const filesInfo = markdownFiles.map((file) => {
			// 使用 settingsFileStats 提供的默认值
			const fileStat = fileStatsMap.get(file.path) || settingsFileStats;

			return {
				// ...file,    ...file 将 Obsidian API 返回的文件对象的所有属性（包括非可序列化的 parent 和 vault）
				// 直接合并到结果中。这些非可序列化的属性导致 Redux 报错。
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
	async compareFileStats(): Promise<SettingsFileStats[]> {
        const currentFiles = this.getFileInfo();
        const fileStatList = this.settings.fileStats
            .map((settingFile) => {
                const currentFile = currentFiles.find(
                    (file) => file.path === settingFile.path
                );
                if (!currentFile) {
                    return { ...settingFile, differents: "文件丢失" };
                }
                if (settingFile.stat.size !== currentFile.stat.size) {
                    return {
                        ...settingFile,
                        differents: `文件大小变化`,
                    };
                }
                return null; // 文件无差异时返回 null
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
                return null;
            })
            .filter(Boolean) as SettingsFileStats[];
    
        return [...fileStatList, ...missingFiles];
    }

	/** 获取文件信息 */
	loadFileStats(): SettingsFileStats[] {
		return this.getFileInfo();
	}

	/**比较文件并返回文件统计信息数组。  */
	async compareFiles(): Promise<SettingsFileStats[]> {
		return await this.compareFileStats();
	}
	/** 更新markTime为当前时间的本地化字符串，同时将fileStats替换为传入的参数 */
	createUpdatedSettings(fileStats: SettingsFileStats[]): WatchtowerSettings {
		
        return {
			...this.plugin.settings,
			markTime: new Date().toLocaleString(),
			fileStats: fileStats,
		};
	}
	/** 将更新的设置数据持久化。 */
	async savePluginData(updatedSettings: WatchtowerSettings): Promise<void> {
		await this.plugin.saveData(updatedSettings);
	}
	/** 通过 Redux 的 dispatch 方法将数据更新到全局状态中 */
	updateState(
		fileStats: SettingsFileStats[],
		differentFiles: SettingsFileStats[]
	): void {
        store.dispatch(setDifferentFiles([]));
		store.dispatch(setFileStatList(fileStats));
		store.dispatch(setFileChange(true));
	}
	/** 保存文件信息到插件存储的异步函数。 */
	saveFileInfo = async (): Promise<void> => {
		// 加载文件信息
		const fileStats = this.loadFileStats();

		// 比较文件信息
		const differentFiles = await this.compareFiles();

		// 更新设置
		const updatedSettings = this.createUpdatedSettings(fileStats);
        
		// 更新状态管理
		// 保存数据到插件存储
		await this.savePluginData(updatedSettings);
		this.updateState(fileStats, differentFiles);

	};
	// /** 保存文件信息 */
	// saveFileInfo = async (): Promise<void> => {
	//     // 加载当前文件信息
	// 	const fileStats = this.getFileInfo();
	// 	store.dispatch(setFileStatList(fileStats));
	// 	// 比较文件信息
	//     const differentFile = await this.compareFileStats();

	// 	const updatedSettings = {
	//         ...this.plugin.settings,
	//         markTime: new Date().toLocaleString(),
	//         fileStats: fileStats,
	//     };
	//     store.dispatch(setFileChange(true));
	// 	store.dispatch(setSettings(updatedSettings));
	//     await this.plugin.saveData(updatedSettings);
	//     store.dispatch(setDifferentFiles(differentFile));
	// };
	// /** 加载文件信息 */
	// loadFileInfo = (): void => {
	//     const fileStats = this.getFileInfo();
	//     store.dispatch(setFileStatList(fileStats));
	// }
}
