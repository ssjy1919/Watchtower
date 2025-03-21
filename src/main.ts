import { Plugin } from "obsidian";
import { WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./setting/settingTab";
import { FileHandler } from "./fileHandler";
import { loadSettings } from "./toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import { RecentFilePluginMain } from "./watchtowerPlugin/recentFilePlugin/RecentFilePluginMain";
import {
    File_supervision,
    VIEW_TYPE_FILE_SUPERVISION,
} from "./watchtowerPlugin/view/leafView";
import { PluginManagerPlugin } from "./pluginManagerPlugin/MainPluginManager";

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

        // 插件管理功能
        new PluginManagerPlugin(this);

        // 注册文件监控插件右边视图
        this.registerView(
            VIEW_TYPE_FILE_SUPERVISION,
            (leaf) => new File_supervision(leaf, this)
        );
        // 挂载插件设置页面
        this.addSettingTab(new WatchtowerSettingTab(this.app, this));
    }

    async onunload() {
        /** 卸载标签叶子 */
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
    }
}