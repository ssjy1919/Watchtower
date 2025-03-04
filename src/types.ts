
/**
 * 不知道为啥 obsidian 的类型定义不包含 fileMap 这个属性，
 * 通过声明 fileMap，扩展 obsidian 的类型定义
 */
// declare module 'obsidian' {
//   interface Vault {
// 	fileMap: TFile[];
//   }
// }

// 定义 FileStatus 接口，用于储存文件路径和字节数
export interface FileStatus {
	path: string;
	size: number;
}

// 定义 WatchtowerSettings 接口，它包含有`FileStatus`接口，新增一个`markTime`用于储存记录时间。
export interface WatchtowerSettings {
	markTime: string;
	fileStatus: FileStatus[];
	filePrefix: boolean;
	leafView: string;
}

// 定义默认的 FileStatus 值
const defaultFileStatus: FileStatus = {
	path: '',
	size: 0
};

// 定义默认的 WatchtowerSettings 值
export const DEFAULT_SETTINGS: WatchtowerSettings = {
	markTime: '1970-01-01 00:00:00',
	fileStatus: [defaultFileStatus],
	filePrefix: false,
	leafView:""
};




