import { Plugin } from "obsidian";
import { VIEW_TYPE_FILE_SUPERVISION } from "./watchtowerPlugin/view/leafView";
import { WatchtowerSettings } from "./watchtowerPlugin/types";
import { WatchtowerSettingTab } from "./settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import { getRecentFiles, loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import { RecentFilePluginMain } from "./recentFilePlugin/RecentFilePluginMain";

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;

    
	async onload() {
		// 加载设置
        await loadSettings(this);
        getRecentFiles(this)
		// 等待应用初始化完成
		if (this.settings.watchtowerPlugin) {
			const watchtowerMain = WatchtowerMain.getInstance(this);
			watchtowerMain.initialize();
        }
        if (this.settings.recentFilePlugin) {
            const recentFilePluginMain = RecentFilePluginMain.getInstance(this);
            recentFilePluginMain.initialize();
        }
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	async onunload() {
		/** 卸载标签叶子 */
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
	}
}
