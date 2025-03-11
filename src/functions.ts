import { App, FileStats, TAbstractFile, WorkspaceLeaf } from "obsidian";
import {
	WatchtowerSettings,
	settingsFileStats,
	defaultFileStatus,
	differentInfos,
	DEFAULT_SETTINGS,
} from "./types";
import { setDifferentFiles, setFileChange, setSettings, store } from "./store";
import { VIEW_TYPE_EXAMPLE } from "./view/leafView";
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
	fileInfo(): {
		basename: string;
		extension: string;
		name: string;
		path: string;
		stat: FileStats;
	}[] {
		// 获取所有 Markdown 文件
		const markdownFiles = this.app.vault.getMarkdownFiles();

		// 遍历文件列表，收集所有文件的信息
		const filesInfo = markdownFiles.map((file) => ({
			basename: file.basename,
			extension: file.basename,
			name: file.basename,
			path: file.path,
			stat: file.stat,
		}));

		// 如果没有找到文件，返回一个空数组
		return filesInfo.length > 0 ? filesInfo : [defaultFileStatus];
	}

	/**
	 * 获取用户设置保存的文件信息
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	settingInfo(): {
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
	 * 对比 settingInfo() 和 fileInfo() 得到的数据
	 * 以 settingInfo() 的 path 为数据 id，对比它们的 stat，返回不相同的数据
	 *
	 * @returns {Array} 包含文件路径和状态的对象数组
	 *         - path: 文件路径
	 *         - stat: 文件状态，包括大小、创建时间和修改时间
	 */
	async compareFileStats(): Promise<differentInfos[]> {
		const settingFiles = this.settingInfo();
		const currentFiles = this.fileInfo();
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
			.filter(Boolean) as (settingsFileStats & { differents: string })[];

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
			.filter(Boolean) as (settingsFileStats & { differents: string })[];

		// 合并不同的文件、多出来的文件和少了的文件
		const allDifferentFiles = [...differentFiles, ...missingFiles];

		// 更新 Redux store 中的 differentFiles 状态
        store.dispatch(setDifferentFiles(allDifferentFiles));
        
        console.log("allDifferentFiles", allDifferentFiles);
		return allDifferentFiles;
	}

	/** 把时间戳转换成日期格式 */
	timestampToDate(timestamp: number): string {
		const date = new Date(timestamp);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}
	/**加载文件信息*/
	loadFileInfo = (): void => {
        const fileInfoData = this.fileInfo();
		const fileStats: settingsFileStats[] = fileInfoData.map((file) => ({
			basename: file.basename,
			extension: file.basename,
			name: file.basename,
			path: file.path,
			stat: file.stat,
		}));
		this.settings = {
            ...this.settings,
			fileStats,
			markTime: new Date().toLocaleString(),
			filePrefix: false,
			leafView: "",
		};
	}
	/** 保存文件信息 */
    saveFileInfo = async (): Promise<void> => {
        
        console.log("this.settings", this.settings);
		// 加载文件信息
		this.loadFileInfo();
        console.log("this.settings", this.settings);
        
        // 加载并比较文件信息
        const differentFile = await this.compareFileStats();
        store.dispatch(setDifferentFiles(differentFile));
		// 使用存储的 plugin 实例
        await activateView(this.plugin);
        // await saveSettings(this.plugin);
        await this.plugin.saveData(this.settings);
		store.dispatch(setSettings(this.settings));
		store.dispatch(setFileChange(true)); // 触发 setFileChange action
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

// 保存用户设置
// export async function saveSettings(plugin: WatchtowerPlugin) {
// 	await plugin.saveData(plugin.settings);
// }

// 激活视图
export async function activateView(plugin: WatchtowerPlugin) {
	const { workspace } = plugin.app;

	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

	if (leaves.length > 0) {
		// 如果视图已存在，直接使用
		leaf = leaves[0];
	} else {
		// 否则创建新的视图
		leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
	}

	// 确保视图可见
	if (leaf) {
		workspace.revealLeaf(leaf);
	}
}

// 注册文件事件处理程序
export function registerFileEventHandlers(plugin: WatchtowerPlugin) {
	const fileEventHandler = async (
		event: string,
		file: TAbstractFile,
		oldPath?: string
	) => {
		store.dispatch(setFileChange(true)); // 触发 setFileChange action
        
		// 加载并比较文件信息
        const differentFiles = await plugin.fileHandler.compareFileStats();
        
		store.dispatch(setDifferentFiles(differentFiles));
	};

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
}
