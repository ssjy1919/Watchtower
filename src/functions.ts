import { App, FileStats } from "obsidian";
import {
	WatchtowerSettings,
	DEFAULT_SETTINGS,
	settingsFileStats,
	defaultFileStatus,
} from "./types";
import { setDifferentFiles, store } from "./store";

/**
 * 获取文件信息
 * 获取所有 Markdown 文件的路径和状态信息如果找不到任何文件，
 * 则返回一个包含空路径和默认状态值的对象数组此函数主要用于获取文件的基本信息
 *
 * @param app {App} Obsidian 应用实例
 * @returns {Array} 包含文件路径和状态的对象数组
 *         - path: 文件路径
 *         - stat: 文件状态，包括大小、创建时间和修改时间
 */
export function fileInfo(app: App): {
	basename: string;
	extension: string;
	name: string;
	path: string;
	stat: FileStats;
}[] {
	// 获取所有 Markdown 文件
	const markdownFiles = app.vault.getMarkdownFiles();

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
export function settingInfo(settings: WatchtowerSettings = DEFAULT_SETTINGS): {
	basename: string;
	extension: string;
	name: string;
	path: string;
	stat: FileStats;
}[] {
	// 获取用户设置保存的文件信息
	const filesInfo = settings.fileStats.map((file) => ({
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
 * @param app {App} Obsidian 应用实例
 * @param settings {WatchtowerSettings} 用户设置
 * @returns {Array} 包含文件路径和状态的对象数组
 *         - path: 文件路径
 *         - stat: 文件状态，包括大小、创建时间和修改时间
 */
export async function compareFileStats(
    app: App,
    settings: WatchtowerSettings = DEFAULT_SETTINGS
): Promise<(settingsFileStats & { difference: string })[]> {
    const settingFiles = settingInfo(settings);
    const currentFiles = fileInfo(app);

    const differentFiles = settingFiles.map((settingFile) => {
        const currentFile = currentFiles.find(
            (file) => file.path === settingFile.path
        );
        if (!currentFile) {
            return { ...settingFile, difference: "extra" }; // settingFile 是多出来的文件
        }
        if (
            settingFile.stat.size !== currentFile.stat.size ||
            settingFile.stat.ctime !== currentFile.stat.ctime ||
            settingFile.stat.mtime !== currentFile.stat.mtime
        ) {
            return { ...settingFile, difference: "modified" }; // settingFile 的状态不同
        }
        return null;
    }).filter(Boolean) as (settingsFileStats & { difference: string })[];

    // 找出 settingFiles 中少了的文件
    const missingFiles = currentFiles.map((currentFile) => {
        if (!settingFiles.find((settingFile) => settingFile.path === currentFile.path)) {
            return { ...currentFile, difference: "missing" }; // currentFile 是少了的文件
        }
        return null;
    }).filter(Boolean) as (settingsFileStats & { difference: string })[];

    // 合并不同的文件、多出来的文件和少了的文件
    const allDifferentFiles = [...differentFiles, ...missingFiles];

    // 更新 Redux store 中的 differentFiles 状态
    store.dispatch(setDifferentFiles(allDifferentFiles));
    return allDifferentFiles;
}

/**把时间戳转换成日期格式*/
export function timestampToDate(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}
