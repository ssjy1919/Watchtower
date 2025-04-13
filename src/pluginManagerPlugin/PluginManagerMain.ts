import WatchtowerPlugin from "src/main";
import { activateMiddleView } from "./PMtools";
import { PluginManagerLeft, VIEW_TYPE_PLUGIN_MANAGER } from "./PMleft";
import { setSettings, store } from "src/store";

export interface PluginManagerPlugin {
	plugin: WatchtowerPlugin;
}

export class PluginManagerPlugin {
	public plugin: WatchtowerPlugin;

	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
		this.plugin.addCommand({
			id: "pluginManagerCenterLeafView",
			name: "打开插件管理视图",
			callback: async () => {
				activateMiddleView(this.plugin);
			},
		});
		this.plugin.addRibbonIcon("blocks", "插件管理", async () => {
			activateMiddleView(this.plugin);
		});
		// 注册插件管理视图
		this.plugin.registerView(
			VIEW_TYPE_PLUGIN_MANAGER,
			(leaf) => new PluginManagerLeft(leaf, this.plugin)
		);
		this.plugin.app.workspace.onLayoutReady(async () => {
			plugin.settings.pluginManager.forEach((plugin) => {
				if (plugin.delayStart > 0) {
					//延时启动
					setTimeout(async () => {
						//@ts-ignore
						app.plugins.enablePlugin(plugin.id);
						const updatedPlugins = store
							.getState()
							.settings.pluginManager.map((p) => {
								if (p.id === plugin.id) {
									return {
										...p,
										enabled: true,
									};
								}
								return p;
							});
						const newSettings = {
							...store.getState().settings,
							pluginManager: updatedPlugins,
						};
						store.dispatch(setSettings(newSettings));
						await this.plugin.saveData(newSettings);
					}, plugin.delayStart * 1000);
				}
			});
		});
	}
}
