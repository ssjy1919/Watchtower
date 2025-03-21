import { Notice } from "obsidian";
import WatchtowerPlugin from "src/main";
import { pluginManager, PluginManager } from "src/types";

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

	/** 获取所有已安装的插件 */
	getAllPlugins(): PluginManager[] {
		//@ts-ignore
		const installedPlugins = Object.keys(app.plugins.manifests).map(
			(id) => {
				//@ts-ignore
				const manifest = app.plugins.manifests[id];
				const pluginSetting =
					this.plugin.settings.pluginManager.find(
						(p) => p.id === id
					) || pluginManager;
				return {
					id,
					name: manifest.name,
					//@ts-ignore
					enabled: app.plugins.enabledPlugins.has(id),
					switchTime: pluginSetting.switchTime,
					comment: pluginSetting.comment,
					delayStart: pluginSetting.delayStart,
					author: manifest.author || "",
					authorUrl: manifest.authorUrl || "",
					description: manifest.description || "",
					dir: manifest.dir || "",
					isDesktopOnly: manifest.isDesktopOnly || false,
					minAppVersion: manifest.minAppVersion || "",
					version: manifest.version || "",
				};
			}
		);
		return installedPlugins;
	}

	/** 获取所有已开启的插件 */
	getEnabledPlugins(): IPlugin[] {
		return this.getAllPlugins().filter((plugin) => plugin.enabled);
	}

	// 获取所有已关闭的插件
	getDisabledPlugins(): IPlugin[] {
		return this.getAllPlugins().filter((plugin) => !plugin.enabled);
	}

	/** 开启插件 */
	async enablePlugin(pluginId: string): Promise<void> {
		//@ts-ignore
		if (app.plugins.manifests[pluginId]) {
			//@ts-ignore
			await app.plugins.enablePluginAndSave(pluginId);
			this.refreshPlugins();
		}
	}

	/** 关闭插件 */
	async disablePlugin(pluginId: string): Promise<void> {
		//@ts-ignore
		if (app.plugins.manifests[pluginId]) {
			//@ts-ignore
			await app.plugins.disablePluginAndSave(pluginId);
			this.refreshPlugins();
		}
	}

	/**
	 * 根据插件 id 查询 DEFAULT_SETTINGS.pluginManager 中对应项的 switchTime
	 * @param pluginId 插件 id
	 * @returns 对应插件项的 switchTime，未找到时返回 0
	 */
	getSwitchTimeByPluginId(pluginId: string): number {
		const pluginEntry = this.plugin.settings.pluginManager.find(
			(pm) => pm.id === pluginId
		);
		return pluginEntry ? pluginEntry.switchTime : 0;
	}

	/** 刷新插件列表 */
	private refreshPlugins(): void {
		this.pluginList = this.getAllPlugins();
	}
	/**
	 * 根据插件 id 打开对应插件的设置页面
	 * @param pluginId 插件 id
	 */
	openPluginSettings(pluginId: string): void {
		//@ts-ignore
		if (!app.plugins.enabledPlugins.has(pluginId)) {
			new Notice("插件未开启", 5000);
			return;
		}
		//@ts-ignore
		if (!app.setting.openTabById(pluginId)) {
			new Notice("此插件没有设置项", 5000);
		} else {
			//@ts-ignore
			app.setting.open();
		}
	}
}
