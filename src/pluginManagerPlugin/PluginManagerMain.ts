import WatchtowerPlugin from "src/main";
import { activateMiddleView, getAllPlugins } from "./PMtools";
import {
	PluginManagerLeft,
	VIEW_TYPE_PLUGIN_MANAGER,
} from "./PluginManagerLeft";
import { setSettings, store } from "src/store";

export interface PluginManagerPlugin {
	plugin: WatchtowerPlugin;
}

export class PluginManagerPlugin {
	public plugin: WatchtowerPlugin;
	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
		/** 初始化插件信息 */
		getAllPlugins(this.plugin);
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
		// this.plugin.registerInterval(
		//     window.setInterval(() =>
		//         store.getState().settings.startTime += 1
		//         , 1000)
		// );

		this.plugin.app.workspace.onLayoutReady(async () => {
			store.getState().settings.pluginManager.forEach((plugin) => {
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
                                        haveSettingTab: true,
									};
								}
								return p;
							});
						const newSettings = {
							...store.getState().settings,
							pluginManager: updatedPlugins,
						};
						store.dispatch(setSettings(newSettings));
					}, plugin.delayStart * 1000);
				}
			});
		});
	}
}
