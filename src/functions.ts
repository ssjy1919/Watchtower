import { App, FileStats } from "obsidian";

/**
 * 获取文件信息
 *
 * 此函数旨在从应用的仓库中获取所有 Markdown 文件的路径和状态信息如果找不到任何文件，
 * 则返回一个包含空路径和默认状态值的对象数组此函数主要用于获取文件的基本信息，如文件大小、
 * 创建时间和修改时间等，以便在应用的不同部分之间共享这些信息
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
	return filesInfo.length > 0
		? filesInfo
		: [
				{
					basename: "",
					extension: "",
					name: "",
					path: "",
					stat: {
						size: 0,
						ctime: 0,
						mtime: 0,
					},
				},
      ];
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
