import { Plugin } from "obsidian";
import { WatchtowerSettings } from "./watchtowerPlugin/types";
import { WatchtowerSettingTab } from "./settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import {  loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import { RecentFilePluginMain } from "./recentFilePlugin/RecentFilePluginMain";

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;


	async onload() {
		// 加载设置
        await loadSettings(this);
        // 等待应用初始化完成
        this.app.workspace.onLayoutReady(async () => {
            if (this.settings.watchtowerPlugin) {
                const watchtowerMain = new WatchtowerMain(this);
                await watchtowerMain.initialize();
            }
            if (this.settings.recentFilePlugin) {
                const recentFilePluginMain = new RecentFilePluginMain(this);
                recentFilePluginMain.initialize();
            }
        });
        // 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}

	async onunload() {
		/** 卸载标签叶子 */
		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
	}
}
