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

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;

	async onload() {
		// 加载设置
		await loadSettings(this);
		this.app.workspace.onLayoutReady(async () => {
			this.fileHandler = new FileHandler(this);

			init(this);
			if (this.settings.watchtowerPlugin) {
				// 等待应用初始化完成
				const watchtowerMain = new WatchtowerMain(this);
				await watchtowerMain.initialize();

				this.registerView(
					VIEW_TYPE_FILE_SUPERVISION,
					(leaf) => new File_supervision(leaf, this)
				);
			}
			if (this.settings.pluginManagerPlugin) {
				new PluginManagerPlugin(this);
			}
		});
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	async onunload() {
		/** 卸载标签页*/
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLUGIN_MANAGER);
	}
	async onExternalSettingsChange() {
		new Notice("Watchtower：插件配置被外部修改。10000");
		await loadSettings(this);
		await init(this);
		getAllPlugins();
		new Notice("Watchtower：重载完毕。",20000 );
	}
}


