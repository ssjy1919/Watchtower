import { TAbstractFile, WorkspaceLeaf } from "obsidian";
import WatchtowerPlugin from "./main";
import { store, setFileChange, setDifferentFiles } from "./store";
import { VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";
import { DEFAULT_SETTINGS } from "./types";

// 注册文件事件处理程序
export function registerFileEventHandlers(plugin: WatchtowerPlugin) {
	const fileEventHandler = async (
		event: string,
		file: TAbstractFile,
		oldPath?: string
	) => {
		if (!plugin.fileHandler) {
			console.error("fileHandler is not initialized yet");
			return;
		}

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

// 激活视图
export async function activateView(plugin: WatchtowerPlugin) {
	if (!plugin.fileHandler) {
		console.warn("fileHandler is not initialized yet, cannot open view.");
		return;
	}
	const { workspace } = plugin.app;

	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);

	if (leaves.length > 0) {
		// 如果视图已存在，直接使用
		leaf = leaves[0];
	} else {
		// 否则创建新的视图
		leaf = workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_FILE_SUPERVISION,
				active: true,
			});
		}
	}

	// 确保视图可见
	if (leaf) {
		workspace.revealLeaf(leaf);
	}
}
/** 把时间戳转换成日期格式 */
export const timestampToDate = (timestamp: number): string => {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}`;
};
// 加载用户设置
export async function loadSettings(plugin: WatchtowerPlugin) {
	plugin.settings = Object.assign(
		{},
		DEFAULT_SETTINGS,
		await plugin.loadData()
	);
}
