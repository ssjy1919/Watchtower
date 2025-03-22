import { FileStats } from "obsidian";

export interface SettingsFileStats {
	basename: string;
	extension: string;
	name: string;
	path: string;
	stat: FileStats;
	differents: string;
	recentOpen: number;
}

/** 已安装的插件对象接口 */
export interface PluginManager {
	id: string;
	name: string;
	/** obsidian应用捕获的插件启用状态，不包括延时启动的插件 */
    enabled: boolean;
	/** 最后开关时间 */
	switchTime: number;
	/** 用户备注 */
	comment: string;
	/** 插件延时启动 */
    delayStart: number;
	author: string;
	authorUrl: string;
	description: string;
	dir: string;
	isDesktopOnly: boolean;
	minAppVersion: string;
	version: string;
}
export const pluginManager: PluginManager = {
	id: "",
	name: "",
    enabled: false,
	switchTime: 0,
	comment: "",
    delayStart: 0,
	author: "",
	authorUrl: "",
	description: "",
	dir: "",
	isDesktopOnly: false,
	minAppVersion: "",
	version: "",
};

// 定义默认的 FileStatus 值
export const settingsFileStats: SettingsFileStats = {
	basename: "",
	extension: "",
	name: "",
	path: "",
	stat: {
		size: 0,
		ctime: 0,
		mtime: 0,
	},
	differents: "",
	recentOpen: 0,
};

export interface SortField {
    /** 排序字段 */
    field: keyof PluginManager | null;
    /** 排序顺序 */
	order: "asc" | "desc" | null;
}

export interface WatchtowerSettings {
	markTime: string;
	fileStats: SettingsFileStats[];
	/** 控制首次安装插件时打开插件标签叶 */
	isFirstInstall: boolean;
	/** 是否启动文件监控功能 */
	watchtowerPlugin: boolean;
	/** 是否启动插件管理功能 */
	pluginManagerPlugin: boolean;
	/** 历史文件列表打开方式 */
	recentOpenFilesMode: boolean;
    pluginManager: PluginManager[];
	sortField: SortField;
}

// 定义默认的 WatchtowerSettings 值
export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: "1970-01-01 00:00:00",
	fileStats: [settingsFileStats],
	isFirstInstall: true,
	watchtowerPlugin: true,
	pluginManagerPlugin: true,
	recentOpenFilesMode: true,
	pluginManager: [pluginManager],
	sortField: {
		field: "enabled",
		order: "desc",
	},
};
