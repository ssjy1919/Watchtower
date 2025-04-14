import WatchtowerPlugin from "src/main";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./PluginManagerLeft";
import { Notice, PluginManifest, WorkspaceLeaf } from "obsidian";
import { pluginManager, PluginManager } from "src/types";
import { setSettings, store } from "src/store";

/**
 * 激活中间区域的视图。
 * 在中间区域左右分屏打开标签页。
 * 如果已有相同类型的视图打开，则直接激活该视图。
 */
export async function activateMiddleView(plugin: WatchtowerPlugin) {
	const { workspace } = plugin.app;

	// 使用 iterateAllLeaves 遍历所有叶子节点，检查是否已有目标视图类型打开
	let existingLeaf: WorkspaceLeaf | undefined;
	workspace.iterateAllLeaves((leaf) => {
		if (leaf.view.getViewType() === VIEW_TYPE_PLUGIN_MANAGER) {
			existingLeaf = leaf;
		}
	});

	if (existingLeaf) {
		// 如果找到已打开的视图，直接激活它
		workspace.setActiveLeaf(existingLeaf);
		return;
	}

	// 如果没有找到，创建一个新的叶子并设置视图状态
	const rightLeaf = workspace.getLeaf("split", "vertical");
	await rightLeaf.setViewState({
		type: VIEW_TYPE_PLUGIN_MANAGER,
		active: true,
	});
}

/** 刷新所有插件信息 */
export function getAllPlugins() {
	const storeSettings = store.getState().settings;
	const installedPlugins = Object.keys(
		//@ts-ignore
		app.plugins.manifests
	).map((id) => {
		//@ts-ignore
		const manifest = app.plugins.manifests[id] as PluginManifest;
		const storePlugin =
			storeSettings.pluginManager.find((p) => p.id === id) ||
			pluginManager;
		return {
			id,
			//@ts-ignore
			haveSettingTab: app.setting.pluginTabs.some(
				//@ts-ignore
				(p) => p.id === storePlugin.id
			)
				? true
				: false,
			name: manifest.name,
			enabled:
				//@ts-ignore 直接获取已启动的插件
				Object.keys(app.plugins.plugins).includes(id),
			switchTime: storePlugin.switchTime,
			group: storePlugin.group,
			comment: storePlugin.comment,
			delayStart: storePlugin.delayStart,
			author: manifest.author || "",
			authorUrl: manifest.authorUrl || "",
			description: manifest.description || "",
			dir: manifest.dir || "",
			isDesktopOnly: manifest.isDesktopOnly || false,
			minAppVersion: manifest.minAppVersion || "",
			version: manifest.version || "",
		};
	}) as PluginManager[];
	const newSettings = {
		...storeSettings,
		pluginManager: installedPlugins,
	};
	store.dispatch(setSettings(newSettings));
}

/** 彻底关闭插件 */
export async function disablePlugin(pluginId: string) {
	//@ts-ignore
	if (app.plugins.manifests[pluginId]) {
		//@ts-ignore
		await app.plugins.disablePluginAndSave(pluginId);
	}
}

/** 完全打开插件 */
export async function enablePlugin(pluginId: string) {
	//@ts-ignore
	if (app.plugins.manifests[pluginId]) {
		//@ts-ignore
		await app.plugins.enablePluginAndSave(pluginId);
	}
}

/**
 * 根据插件 id 打开对应插件的设置页面
 * @param IPlugin
 */
export function openPluginSettings(iplugin: PluginManager): void {
	if (!iplugin.enabled) {
		new Notice("插件未开启", 5000);
		return;
	}
	//@ts-ignore
	if (!app.setting.openTabById(iplugin.id)) {
		new Notice("此插件没有设置项", 5000);
	} else {
		//@ts-ignore
		app.setting.open();
	}
}

/**
 * 根据插件 id 查询 DEFAULT_SETTINGS.pluginManager 中对应项的 switchTime
 * @param pluginId 插件 id
 * @returns 对应插件项的 switchTime，未找到时返回 0
 */
export function getSwitchTimeByPluginId(pluginId: string): number {
	const pluginEntry = store.getState().settings.pluginManager.find(
		(pm) => pm.id === pluginId
	);
	return pluginEntry ? pluginEntry.switchTime : 0;
}
