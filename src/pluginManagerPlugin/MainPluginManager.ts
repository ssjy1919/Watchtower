import WatchtowerPlugin from "src/main";
import { activateMiddleView } from "./toolsPluginManager";
import { PluginManagerLeft, VIEW_TYPE_PLUGIN_MANAGER } from "./PluginManagerLeft";

export interface PluginManagerPlugin {
    plugin: WatchtowerPlugin;
}

export class PluginManagerPlugin {
    public plugin: WatchtowerPlugin;

    constructor(plugin: WatchtowerPlugin) {
        this.plugin = plugin;
        this.plugin.addCommand({
			id: "pluginManagerCenterLeafView",
			name: "打开中间视图",
			callback: async () => {
				activateMiddleView(this.plugin);
			},
		});
        // 注册文件监控插件右边视图
        this.plugin.registerView(
            VIEW_TYPE_PLUGIN_MANAGER,
            (leaf) => new PluginManagerLeft(leaf, this.plugin)
        );
    }
}
