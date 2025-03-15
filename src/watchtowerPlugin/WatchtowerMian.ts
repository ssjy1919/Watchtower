import { FileHandler } from "src/watchtowerPlugin/fileHandler";
import WatchtowerPlugin from "src/main";
import {
	store,
	setFileStatList,
	setDifferentFiles,
	setSettings,
} from "src/watchtowerPlugin/store";
import {
	activateView,
	activateMiddleView,
	registerFileEventHandlers,
} from "src/watchtowerPlugin/toolsFC";
import {
	VIEW_TYPE_FILE_SUPERVISION,
	File_supervision,
} from "src/watchtowerPlugin/view/leafView";
import { renderStatusBarView } from "src/watchtowerPlugin/view/statusBarView";

export interface WatchtowerMain {
	plugin: WatchtowerPlugin;
}

export class WatchtowerMain {
	private static instance: WatchtowerMain; // 静态属性，存储唯一实例
	public plugin: WatchtowerPlugin;

	private constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
	}

	// 静态方法，获取唯一实例
	public static getInstance(plugin: WatchtowerPlugin): WatchtowerMain {
		if (!WatchtowerMain.instance) {
			WatchtowerMain.instance = new WatchtowerMain(plugin);
		}
		return WatchtowerMain.instance;
	}

	async initialize() {
		// this.plugin.app.workspace.onLayoutReady(async () => {
		// 初始化 FileHandler
		this.plugin.fileHandler = new FileHandler(
			this.plugin.app,
			this.plugin.settings,
			this.plugin
		);

		// 加载文件信息
		const fileStatList = this.plugin.fileHandler.loadFileStats();
		store.dispatch(setFileStatList(fileStatList));
		// 比较文件差异
		const differentFiles = await this.plugin.fileHandler.compareFiles();
		store.dispatch(setDifferentFiles(differentFiles));
		store.dispatch(setSettings(this.plugin.settings));
		// 注册文件事件监听
		registerFileEventHandlers(this.plugin);
		// });

		this.plugin.registerView(
			VIEW_TYPE_FILE_SUPERVISION,
			(leaf) => new File_supervision(leaf, this.plugin)
		);

		this.plugin.addRibbonIcon("telescope", "文件状态", async () => {
			await activateView(this.plugin);
		});

		this.plugin.addCommand({
			id: "WatchtowerLeafView",
			name: "打开侧边视图",
			callback: async () => {
				await activateView(this.plugin);
			},
		});

		this.plugin.addCommand({
			id: "WatchtowerCenterLeafView",
			name: "打开中间视图",
			callback: async () => {
				activateMiddleView(this.plugin);
			},
		});

		this.plugin.addCommand({
			id: "WatchtowerMark",
			name: "保存文件信息",
			callback: async () => {
				await this.plugin.fileHandler.saveFileInfo();
			},
		});

		// 添加状态栏项目
		const statusBarItemEl = this.plugin.addStatusBarItem();
		renderStatusBarView(statusBarItemEl, this.plugin);
	}
}
