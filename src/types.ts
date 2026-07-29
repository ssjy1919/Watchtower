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

export const CONFIG_FILES = {
	FILE_STATE_DATA: "file_state.json",
	// NEW_DATA: "newdata.json",
} as const;

export type ConfigFileName = (typeof CONFIG_FILES)[keyof typeof CONFIG_FILES];

// /**
//  * 类型守卫：用于运行时验证字符串是否为合法配置文件名
//  */
//  export function isConfigFile(name: string): name is ConfigFileName {
//   return Object.values(CONFIG_FILES).includes(name as ConfigFileName);
// }

/** file_state.json 数据*/
export interface FileSupervisionData {
	/** 保存文件信息的时间 */
	markTime: string;
	/** 文件信息 */
	fileStats: SettingsFileStats[];
}

/** 配置文件类型映射 */
export type ConfigFileMap = {
	[CONFIG_FILES.FILE_STATE_DATA]: FileSupervisionData;
};

/** 最近打开的历史文件 */
export interface RecentOpenFile {
	/** 文件路径 */
	path: string;
	/** 文件名称 */
	name: string;
	/** 基础名字 */
	basename: string;
	/** 文件后缀 */
	extension: string;
	/** 文件最后打开时间 */
	recentOpen: number;
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
	/** 文件监控功能排除的文件类型 */
	MonitoredFileExcludes: string[];
	/** 是否添加底部状态栏图标 */
	statusBarIcon: boolean;
	/** 最近打开的历史文件 */
	recentOpenFile: RecentOpenFile[];
	/** 新旧标签页打开历史文件方式 */
	recentFilesOpenMode: boolean;
	/** 需要排除的历史文件后缀 */
	recentFileExcludes: string[];
	/** 显示历史文件的数量 */
	recentFilesCount: number;
}

export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: "记录时间为空",
	fileStats: [settingsFileStats],
	isFirstInstall: true,
	watchtowerPlugin: true,
	MonitoredFileExcludes: ["png", "jpg", "jpeg", "gif", "webp"],
	statusBarIcon: true,
	recentFilesOpenMode: false,
	recentFileExcludes: ["png"],
	recentFilesCount: 50,
	recentOpenFile: [
		{
			path: "",
			name: "",
			basename: "",
			extension: "",
			recentOpen: 0,
		},
	],
};
export const FILE_STATE_DATA: FileSupervisionData = {
	markTime: "记录时间为空",
	fileStats: [settingsFileStats],
};
