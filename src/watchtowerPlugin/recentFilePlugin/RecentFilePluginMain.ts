import WatchtowerPlugin from "src/main";
import { activateView } from "src/toolsFC";
import { VIEW_TYPE_FILE_SUPERVISION, File_supervision } from "src/watchtowerPlugin/view/leafView";
import { renderStatusBarView } from "src/watchtowerPlugin/view/statusBarView";

export interface RecentFilePluginMain {
    plugin: WatchtowerPlugin;
}

export class RecentFilePluginMain {
    public plugin: WatchtowerPlugin;

    constructor(plugin: WatchtowerPlugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.plugin.app.workspace.onLayoutReady(async () => {
            if (this.plugin.settings.isFirstInstall) {
                activateView(this.plugin);
                this.plugin.settings.isFirstInstall = false;
            }
        });

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