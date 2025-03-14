import { App, FileStats } from "obsidian";
import {
	WatchtowerSettings,
	settingsFileStats,
	defaultFileStatus,
} from "./types";
import { setDifferentFiles, setFileChange, setSettings, store } from "./store";
import WatchtowerPlugin from "./main";

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
	getFileInfo(): {
		basename: string;
		extension: string;
		name: string;
		path: string;
		stat: FileStats;
		differents: string; // 新增字段
	}[] {
		// 获取所有 Markdown 文件
		const markdownFiles = this.app.vault.getMarkdownFiles();

		// 将 settings.fileStats 转换为 Map，提高查找效率
		const fileStatsMap = new Map(
			this.settings.fileStats.map((file) => [file.path, file])
		);

		// 遍历文件列表，收集所有文件的信息
		const filesInfo = markdownFiles.map((file) => {
			// 使用 fileStatsMap 快速查找 differents
			const differents = fileStatsMap.get(file.path)?.differents || "";

			return {
				basename: file.basename,
				extension: file.extension,
				name: file.name,
				path: file.path,
				stat: file.stat,
				differents, // 新增字段
			};
		});

		// 如果没有找到文件，返回一个空数组
		return filesInfo.length > 0 ? filesInfo : [defaultFileStatus];
	}

	/**
	 * 获取用户设置保存的文件信息
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	getSettingInfo(): {
		basename: string;
		extension: string;
		name: string;
		path: string;
		stat: FileStats;
	}[] {
		// 获取用户设置保存的文件信息
		const filesInfo = this.settings.fileStats.map((file) => ({
			basename: file.basename,
			extension: file.extension,
			name: file.name,
			path: file.path,
			stat: file.stat,
		}));

		// 如果没有找到文件，返回一个空数组
		return filesInfo.length > 0 ? filesInfo : [defaultFileStatus];
	}

	/**
	 * 对比 getSettingInfo() 和 getFileInfo() 得到的数据
	 * 以 getSettingInfo() 的 path 为数据 id，对比它们的 stat，返回不相同的数据
	 *
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	async compareFileStats(): Promise<settingsFileStats[]> {
		const settingFiles = this.getSettingInfo();
		const currentFiles = this.getFileInfo();
		const differentFiles = settingFiles
			.map((settingFile) => {
				const currentFile = currentFiles.find(
					(file) => file.path === settingFile.path
				);
				if (!currentFile) {
					return { ...settingFile, differents: "文件丢失" };
				}
				if (settingFile.stat.size > currentFile.stat.size) {
					return {
						...settingFile,
						differents: `减少${
							settingFile.stat.size - currentFile.stat.size
						}字节`,
					};
				} else if (settingFile.stat.size < currentFile.stat.size) {
					return {
						...settingFile,
						differents: `增加${
							currentFile.stat.size - settingFile.stat.size
						}字节`,
					};
				}
				return null;
			})
			.filter(Boolean) as settingsFileStats[]; //这里可以改为-1 0 1

		// 找出 settingFiles 中少了的文件
		const missingFiles = currentFiles
			.map((currentFile) => {
				if (
					!settingFiles.find(
						(settingFile) => settingFile.path === currentFile.path
					)
				) {
					return { ...currentFile, differents: "新增文件" };
				}
				return null;
			})
			.filter(Boolean) as settingsFileStats[];

		// 合并不同的文件、多出来的文件和少了的文件
		const allDifferentFiles = [...differentFiles, ...missingFiles];


		// console.log("allDifferentFiles", allDifferentFiles);
		return allDifferentFiles;
	}
	/**加载文件信息*/
	loadFileInfo = (): void => {
		const fileInfoData = this.getFileInfo();
		const fileStats: settingsFileStats[] = fileInfoData.map((file) => ({
			basename: file.basename,
			extension: file.basename,
			name: file.basename,
			path: file.path,
			stat: file.stat,
            differents: file.differents,
            
		}));
        this.settings.fileStats = fileStats
        
	};
	/** 保存文件信息 */
	saveFileInfo = async (): Promise<void> => {
		// 加载文件信息
		this.loadFileInfo();
        // 比较文件信息
        
		const differentFile = await this.compareFileStats();
		store.dispatch(setDifferentFiles(differentFile));

		// 更新 Redux store 中的 differentFiles 状态
		this.plugin.settings.markTime = new Date().toLocaleString();
		store.dispatch(setSettings(this.plugin.settings));

		await this.plugin.saveData(this.plugin.settings);
		store.dispatch(setFileChange(true));
	};
}
