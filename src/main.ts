import { Plugin } from "obsidian";
import { WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./setting/settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import { activateView, loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import {
	File_supervision,
	VIEW_TYPE_FILE_SUPERVISION,
} from "./watchtowerPlugin/view/leafView";
import { PluginManagerPlugin } from "./pluginManagerPlugin/MainPluginManager";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./pluginManagerPlugin/PMleft";

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;

	async onload() {
		// 加载设置
		await loadSettings(this);
		if (this.settings.watchtowerPlugin) {
			const watchtowerMain = new WatchtowerMain(this);
			await watchtowerMain.initialize();
			if (this.settings.isFirstInstall) {
				activateView(this);
				this.settings.isFirstInstall = false;
			}
		}
		if (this.settings.watchtowerPlugin) {
			// 插件管理功能
			if (this.settings.pluginManagerPlugin)
				new PluginManagerPlugin(this);
			this.registerView(
				VIEW_TYPE_FILE_SUPERVISION,
				(leaf) => new File_supervision(leaf, this)
			);
		}
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	async onunload() {
		/** 卸载标签叶子 */
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLUGIN_MANAGER);
	}
}
