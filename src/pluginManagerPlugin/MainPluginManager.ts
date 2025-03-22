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
        //延时启动
		plugin.settings.pluginManager.forEach((plugin) => {
			if (plugin.delayStart > 0) {
				//延时启动
				setTimeout(() => {
					//@ts-ignore
					app.plugins.enablePlugin(plugin.id);
					const updatedPlugins =
                    this.plugin.settings.pluginManager.map((p) => {
                        if (p.id === plugin.id) {
                                console.log(`${plugin.delayStart}秒到了，启动插件：`, plugin);
								return {
									...p,
                                    enabled: true,
								};
							}
							return p;
						});
					this.plugin.settings.pluginManager = updatedPlugins;
					store.dispatch(setSettings(this.plugin.settings));
				}, plugin.delayStart * 1000);
			}
		});
	}
}
