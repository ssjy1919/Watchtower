


import { FileStats } from "obsidian";

// 定义 FileStatus 接口，用于储存文件路径和字节数
export interface settingsFileStats {
		basename: string;
		extension: string;
		name: string;
		path: string;
		stat: FileStats;
        differents: string;
        
}

// 定义 WatchtowerSettings 接口，它包含有`FileStatus`接口，新增一个`markTime`用于储存记录时间。
export interface WatchtowerSettings {
	markTime: string;
    fileStats: settingsFileStats[];
    /** 控制首次安装插件时打开插件标签叶 */
	isFirstInstall: boolean;
}





// 定义默认的 FileStatus 值
export const defaultFileStatus: settingsFileStats = {
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
}

// 定义默认的 WatchtowerSettings 值
export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: '1970-01-01 00:00:00',
	fileStats: [defaultFileStatus],
	isFirstInstall: true,
};
