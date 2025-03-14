import { Plugin } from "obsidian";
import { File_supervision, VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";
import { WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./view/settingTab";
import { FileHandler } from "./fileHandler";
import { setDifferentFiles, setSettings, store } from "./store";
import { renderStatusBarView } from "./view/statusBarView";
import {
    activateMiddleView,
	activateView,
	loadSettings,
	registerFileEventHandlers,
} from "./toolsFC";



export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;

	async onload() {
		// 加载设置
		await loadSettings(this);
		// 等待应用初始化完成
		this.app.workspace.onLayoutReady(async () => {
			// 初始化 FileHandler，传入 plugin 实例
			this.fileHandler = new FileHandler(this.app, this.settings, this);
			// 加载并比较文件信息
			const differentFiles = await this.fileHandler.compareFileStats();
			store.dispatch(setDifferentFiles(differentFiles));
			//同步设置信息到store
			store.dispatch(setSettings(this.settings));
            if (this.settings.isFirstInstall) {
                console.log("isFirstInstall");
				activateView(this);
				this.settings.isFirstInstall = false;
			}
			// 注册文件事件监听
			registerFileEventHandlers(this);
			this.registerView(
				VIEW_TYPE_FILE_SUPERVISION,
				(leaf) => new File_supervision(leaf, this)
			);
			this.addRibbonIcon("telescope", "文件状态", async () => {
				await activateView(this);
			});
		});

		this.addCommand({
			id: "WatchtowerLeafView",
			name: "打开侧边视图",
			callback: async () => {
				await activateView(this);
			},
		});

		this.addCommand({
			id: "WatchtowerCenterLeafView",
			name: "打开中间视图",
			callback: async () => {
				activateMiddleView(this);
			},
		});

		this.addCommand({
			id: "WatchtowerMark",
			name: "保存文件信息",
			callback: async () => {
				await this.fileHandler.saveFileInfo();
			},
		});
		// 添加状态栏项目
		const statusBarItemEl = this.addStatusBarItem();
		renderStatusBarView(statusBarItemEl, this);
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	async onunload() {
		/** 卸载标签叶子 */
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
	}
}
