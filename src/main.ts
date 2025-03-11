
import { Plugin } from "obsidian";
import { ExampleView, VIEW_TYPE_EXAMPLE } from "./view/leafView";
import {
    WatchtowerSettings,
} from "./types";
import { WatchtowerSettingTab } from "./view/settingTab";
import { FileHandler } from "./functions";
import { 
    loadSettings, 
    activateView, 
    registerFileEventHandlers 
} from "./functions";
import { setSettings, setDifferentFiles, store } from "./store";

export default class WatchtowerPlugin extends Plugin {
    public settings: WatchtowerSettings;
    public fileHandler: FileHandler;

    async onload() {
        // 加载设置
        await loadSettings(this);
        store.dispatch(setSettings(this.settings));
        
        // 初始化 FileHandler，传入 plugin 实例
        this.fileHandler = new FileHandler(this.app, this.settings, this);

        // 等待应用初始化完成
        this.app.workspace.onLayoutReady(async () => {
            // 加载并比较文件信息
            const differentFiles = await this.fileHandler.compareFileStats();
            store.dispatch(setDifferentFiles(differentFiles));
            activateView(this)
        });
        
        this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf, this));
        this.addRibbonIcon("dice", "文件状态", () => {
            activateView(this);
        });

        this.addCommand({
            id: "WatchtowerLeafView",
            name: "打开Watchtower侧边视图",
            callback: async () => {},
        });

        this.addCommand({
            id: "WatchtowerMark",
            name: "保存文件信息",
            callback: async () => {
                // 使用 fileHandler 的 saveFileInfo 方法
                await this.fileHandler.saveFileInfo();
            },
        });

        // 挂载插件设置页面
        this.addSettingTab(new WatchtowerSettingTab(this.app, this));

        // 注册文件事件监听
        registerFileEventHandlers(this);
    }

    async onunload() {}
}