import { Plugin } from "obsidian";
import { File_supervision, VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";
import { WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./view/settingTab";
import { FileHandler } from "./functions";
import {
	loadSettings,
	activateView,
	registerFileEventHandlers,
} from "./functions";
import { setSettings, setDifferentFiles, store } from "./store";
import { renderStatusBarView } from "./view/statusBarView";
export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;

	async onload() {
		// 加载设置
		await loadSettings(this);
		store.dispatch(setSettings(this.settings));
		// 等待应用初始化完成
		this.app.workspace.onLayoutReady(async () => {
			// 初始化 FileHandler，传入 plugin 实例
			this.fileHandler = new FileHandler(this.app, this.settings, this);

			// 加载并比较文件信息
			const differentFiles = await this.fileHandler.compareFileStats();
			store.dispatch(setDifferentFiles(differentFiles));
			if (this.settings.isFirstInstall) {
				activateView(this);
				this.settings.isFirstInstall = false;
			}
			// this.activateMiddleView();
			// 注册文件事件监听
			registerFileEventHandlers(this);
		});

		this.registerView(
			VIEW_TYPE_FILE_SUPERVISION,
			(leaf) => new File_supervision(leaf, this)
		);
		this.addRibbonIcon("telescope", "文件状态", () => {
			activateView(this);
		});

		this.addCommand({
			id: "WatchtowerLeafView",
			name: "打开Watchtower侧边视图",
			callback: async () => {
				await activateView(this);
			},
		});

		this.addCommand({
			id: "WatchtowerMark",
			name: "保存文件信息",
			callback: async () => {
				// 使用 fileHandler 的 saveFileInfo 方法
				await this.fileHandler.saveFileInfo();
			},
		});

		// 添加状态栏项目
		const statusBarItemEl = this.addStatusBarItem();
		renderStatusBarView(statusBarItemEl, this);

		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	/** 激活中间区域的视图 */
	async activateMiddleView() {
		// 获取一个中间区域的叶子
		const leaf = this.app.workspace.getLeaf(false); // false 表示不在侧边栏中
		await leaf.setViewState({
			type: VIEW_TYPE_FILE_SUPERVISION,
			active: true,
		});
		this.app.workspace.setActiveLeaf(leaf); // 设置为活动叶子
	}
	async onunload() {
		/** 卸载标签叶子 */
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
	}
}
