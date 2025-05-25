import { Notice, Plugin } from "obsidian";
import { WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./setting/settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import { init, loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import {
	File_supervision,
	VIEW_TYPE_FILE_SUPERVISION,
} from "./watchtowerPlugin/view/leafView";
import { PluginManagerPlugin } from "./pluginManagerPlugin/PluginManagerMain";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./pluginManagerPlugin/PluginManagerLeft";
import { getAllPlugins } from "./pluginManagerPlugin/PMtools";
import { renderStatusBarView } from "./watchtowerPlugin/view/statusBarView";

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;
	private statusBarRoot?: import("react-dom/client").Root;

	async onload() {
		// 加载设置
		await loadSettings(this);
		// 等待应用初始化完成
		this.app.workspace.onLayoutReady(() => {
			this.fileHandler = new FileHandler(this);
			init(this);
			if (this.settings.watchtowerPlugin) {
				const watchtowerMain = new WatchtowerMain(this);
				watchtowerMain.initialize();
			}
			if (this.settings.pluginManagerPlugin) {
				new PluginManagerPlugin(this);
			}
		});
		if (this.settings.watchtowerPlugin) {
			this.registerView(
				VIEW_TYPE_FILE_SUPERVISION,
				(leaf) => new File_supervision(leaf, this)
			);
		}
		if (this.settings.statusBarIcon && this.settings.watchtowerPlugin) {
			const container = this.addStatusBarItem();
			this.statusBarRoot = renderStatusBarView(container, this);
		}
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLUGIN_MANAGER);
		if (this.statusBarRoot && this.settings.watchtowerPlugin) {
			this.statusBarRoot.unmount();
		}
	}
	async onExternalSettingsChange() {
		new Notice("Watchtower：插件配置被大量修改,重载插件配置。");
		await loadSettings(this);
		init(this);
		getAllPlugins();
		new Notice("Watchtower：重载完毕。", 10000);
	}
}
