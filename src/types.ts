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

export interface WatchtowerSettings {
	markTime: string;
	fileStats: SettingsFileStats[];
	/** 控制首次安装插件时打开插件标签叶 */
	isFirstInstall: boolean;
	/** 启动文件监控功能 */
    watchtowerPlugin: boolean;
    recentFilePlugin: boolean;
    
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

// 定义默认的 WatchtowerSettings 值
export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: "1970-01-01 00:00:00",
	fileStats: [settingsFileStats],
	isFirstInstall: true,
    watchtowerPlugin: false,
    recentFilePlugin: false,
};
