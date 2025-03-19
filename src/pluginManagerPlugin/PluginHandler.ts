import WatchtowerPlugin from "src/main";

export interface IPlugin {
	id: string;
	name: string;
	enabled: boolean;
}
export interface PluginHandler {
	plugin: WatchtowerPlugin;
}
export class PluginHandler {
    private plugins: IPlugin[];
    plugin: WatchtowerPlugin;

    constructor(plugin: WatchtowerPlugin) {
        this.plugins = [];
        this.plugin = plugin;
    }

    // 获取所有已安装的插件
    getAllPlugins(): IPlugin[] {
        //@ts-ignore
        const installedPlugins = Object.keys(app.plugins.manifests).map(
            (id) => {
                //@ts-ignore
                const manifest = app.plugins.manifests[id];
                return {
                    id,
                    name: manifest.name,

                    //@ts-ignore
                    enabled: app.plugins.enabledPlugins.has(id),
                };
            }
        );
        return installedPlugins;
    }

    // 获取所有已开启的插件
    getEnabledPlugins(): IPlugin[] {
        return this.getAllPlugins().filter((plugin) => plugin.enabled);
    }

    // 获取所有已关闭的插件
    getDisabledPlugins(): IPlugin[] {
        return this.getAllPlugins().filter((plugin) => !plugin.enabled);
    }

    // 开启插件
    enablePlugin(pluginId: string): void {
        //@ts-ignore
        if (app.plugins.manifests[pluginId]) {
            //@ts-ignore
            app.plugins.enablePlugin(pluginId);
            this.refreshPlugins();
        }
    }

    // 关闭插件
    disablePlugin(pluginId: string): void {
        //@ts-ignore
        if (app.plugins.manifests[pluginId]) {
            //@ts-ignore
            app.plugins.disablePlugin(pluginId);
            this.refreshPlugins();
        }
    }

    // 刷新插件列表
    private refreshPlugins(): void {
        this.plugins = this.getAllPlugins();
    }
}