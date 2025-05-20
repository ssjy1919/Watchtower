import { FileStats } from "obsidian";
/** 文件信息 */
export interface SettingsFileStats {
	/** 不包含后缀文件名 */
	basename: string;
	/** 文件后缀 */
	extension: string;
	/** 不包含路径的文件名 */
	name: string;
	/** 文件完整路径包括后缀 */
	path: string;
	/** 文件状态 */
	stat: FileStats;
	/** 文件差异 */
	differents: string;
	/** 最近打开时间 */
	recentOpen: number;
}

/** 已安装的插件对象接口 */
export interface PluginManager {
	id: string;
	name: string;
	/** obsidian应用捕获的插件启用状态，不包括延时启动的插件 */
	enabled: boolean;
	/** 最后更改时间 */
	switchTime: number;
	/** 用户备注 */
	comment: string;
	/** 插件延时启动 */
	delayStart: number;
	/** 作者 */
	author: string;
	/** 仓库地址 */
	authorUrl: string;
	/** 插件描述 */
	description: string;
	/** 插件路径 */
	dir: string;
	/** 是否仅桌面端可用 */
	isDesktopOnly: boolean;
	/** 最低obsidian版本 */
	minAppVersion: string;
	/** 插件版本 */
	version: string;
	/** 是否有设置页 */
	haveSettingTab: boolean;
	/** 分组 */
	tags: string[];
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
	haveSettingTab: false,
	tags: [],
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
	field: keyof PluginManager ;
	/** 排序顺序 */
	order: "asc" | "desc" ;
}

export interface WatchtowerSettings {
	/** 保存文件信息的时间 */
	markTime: string;
	/** 文件信息 */
	fileStats: SettingsFileStats[];
	/** 控制首次安装插件时打开插件标签叶 */
	isFirstInstall: boolean;
	/** 是否启动文件监控功能 */
	watchtowerPlugin: boolean;
	/** 是否启动插件管理功能 */
	pluginManagerPlugin: boolean;
	/** 历史文件列表配置 */
	recentFilesOpenMode: boolean;
	/** 插件信息 */
	pluginManager: PluginManager[];
	/** 插件管理页面的排序字段 */
	sortField: SortField;
	/** 插件分组标签 */
	pluginGroups: string[];
	/** 显示插件分组标签 */
    showPluginGroups: string;
    /** 插件首字母分组 */
	showPluginInitial: string;
}

// 定义默认的 WatchtowerSettings 值
export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: "记录时间为空",
	fileStats: [settingsFileStats],
	isFirstInstall: true,
	watchtowerPlugin: true,
	pluginManagerPlugin: true,
	recentFilesOpenMode: false,
	pluginManager: [pluginManager],
    pluginGroups: [],
    showPluginGroups: "",
    showPluginInitial:"#",
	sortField: {
		field: "enabled",
		order: "desc",
	},
};
