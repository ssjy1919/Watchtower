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
    private pluginList: IPlugin[];
    plugin: WatchtowerPlugin;

    constructor(plugin: WatchtowerPlugin) {
        this.pluginList = [];
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

    /** 开启插件 */
    enablePlugin(pluginId: string): void {
        //@ts-ignore
        if (app.plugins.manifests[pluginId]) {
            //@ts-ignore
            app.plugins.enablePlugin(pluginId);
            this.refreshPlugins();
        }
    }

    /** 关闭插件 */
    disablePlugin(pluginId: string): void {
        //@ts-ignore
        if (app.plugins.manifests[pluginId]) {
            //@ts-ignore
            app.plugins.disablePlugin(pluginId);
            this.refreshPlugins();
        }
    }

    /**
     * 根据插件 id 查询 DEFAULT_SETTINGS.pluginManager 中对应项的 switchTime
     * @param pluginId 插件 id
     * @returns 对应插件项的 switchTime，未找到时返回 -1
     */
    getSwitchTimeByPluginId(pluginId: string): number {
        const pluginEntry = this.plugin.settings.pluginManager.find(pm => pm.id === pluginId);
        return pluginEntry ? pluginEntry.switchTime : -1;
    }

    // 刷新插件列表
    private refreshPlugins(): void {
        this.pluginList = this.getAllPlugins();
    }
}