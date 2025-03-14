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

/** 激活右边视图 */
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

	/** 激活中间区域的视图 */
export async function activateMiddleView(plugin: WatchtowerPlugin) {
    // 获取一个中间区域的叶子
    const leaf = plugin.app.workspace.getLeaf(false); // false 表示不在侧边栏中
    await leaf.setViewState({
        type: VIEW_TYPE_FILE_SUPERVISION,
        active: true,
    });
    plugin.app.workspace.setActiveLeaf(leaf); // 设置为活动叶子
}



// 加载用户设置
export async function loadSettings(plugin: WatchtowerPlugin) {
	plugin.settings = Object.assign(
		{},
		DEFAULT_SETTINGS,
		await plugin.loadData()
	);
}
