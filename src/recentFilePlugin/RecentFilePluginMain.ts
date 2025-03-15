import WatchtowerPlugin from "src/main";
import { activateView, activateMiddleView } from "src/watchtowerPlugin/toolsFC";
import { VIEW_TYPE_FILE_SUPERVISION, File_supervision } from "src/watchtowerPlugin/view/leafView";
import { renderStatusBarView } from "src/watchtowerPlugin/view/statusBarView";

export interface RecentFilePluginMain {
    plugin: WatchtowerPlugin;
}

export class RecentFilePluginMain {
    private static instance: RecentFilePluginMain; // 静态属性，存储唯一实例
    public plugin: WatchtowerPlugin;

    // 私有构造函数，防止外部直接实例化
    private constructor(plugin: WatchtowerPlugin) {
        this.plugin = plugin;
    }

    // 静态方法，获取唯一实例
    public static getInstance(plugin: WatchtowerPlugin): RecentFilePluginMain {
        if (!RecentFilePluginMain.instance) {
            RecentFilePluginMain.instance = new RecentFilePluginMain(plugin);
        }
        return RecentFilePluginMain.instance;
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
            id: "WatchtowerCenterLeafView",
            name: "打开中间视图",
            callback: async () => {
                activateMiddleView(this.plugin);
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