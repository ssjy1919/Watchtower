import WatchtowerPlugin from "src/main";
import { activateMiddleView } from "./PMtools";
import { PluginManagerLeft, VIEW_TYPE_PLUGIN_MANAGER } from "./PMleft";

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

		this.plugin.addRibbonIcon("blocks", "管理插件", async () => {
			activateMiddleView(this.plugin);
		});
		// 注册文件插件管理视图
		this.plugin.registerView(
			VIEW_TYPE_PLUGIN_MANAGER,
			(leaf) => new PluginManagerLeft(leaf, this.plugin)
		);
	}
}
