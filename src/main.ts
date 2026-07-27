import { Notice, Plugin } from "obsidian";
import {
	CONFIG_FILES,
	ConfigFileMap,
	ConfigFileName,
	FileSupervisionData,
	WatchtowerSettings,
} from "./types";
import { WatchtowerSettingTab } from "./setting/settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import { init, loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import {
	File_supervision,
	VIEW_TYPE_FILE_SUPERVISION,
} from "./watchtowerPlugin/view/leafView";
import { PluginManagerPlugin } from "./pluginManagerPlugin/PluginManagerMain";
import {
	PluginManagerLeft,
	VIEW_TYPE_PLUGIN_MANAGER,
} from "./pluginManagerPlugin/PluginManagerLeft";
import { getAllPlugins } from "./pluginManagerPlugin/PMtools";
import { renderStatusBarView } from "./watchtowerPlugin/view/statusBarView";
import { FileService } from "./FileService";
import { store, updataFSstates, updataSettings } from "./store";
import { TaskScheduler } from "./services/taskScheduler";
import { PluginFetcher } from "./services/pluginFetcher";
import { PluginInstaller } from "./services/pluginInstaller";
export default class WatchtowerPlugin extends Plugin {
	public settings!: WatchtowerSettings;
	public fileSupervision!: FileSupervisionData;
	public fileHandler!: FileHandler;
	public taskScheduler!: TaskScheduler;
	private statusBarRoot?: import("react-dom/client").Root;
	async onload() {
		// 加载设置
		await loadSettings(this);
		FileService.getInstance(this);
		// 加载 JSON 文件
		await this.loadSettingsDataFile(CONFIG_FILES.FILE_STATE_DATA);
		store.dispatch(updataFSstates(this.fileSupervision));
		store.dispatch(updataSettings(this.settings));

		// 注册命令
		this.registerCommands();

		// 等待应用初始化完成
		this.app.workspace.onLayoutReady(async () => {
			this.fileHandler = new FileHandler(this);

			await init(this);
			if (this.settings.watchtowerPlugin) {
				const watchtowerMain = new WatchtowerMain(this);
				watchtowerMain.initialize();
			}
			if (this.settings.pluginManagerPlugin) {
				new PluginManagerPlugin(this);
			}

			// 初始化任务调度器
			if (this.settings.enableScheduler) {
				this.taskScheduler = new TaskScheduler(this);
				this.taskScheduler.initialize();
			}
		});
		if (this.settings.watchtowerPlugin)
			this.registerView(
				VIEW_TYPE_FILE_SUPERVISION,
				(leaf) => new File_supervision(leaf, this)
			);

		if (this.settings.pluginManagerPlugin)
			this.registerView(
				VIEW_TYPE_PLUGIN_MANAGER,
				(leaf) => new PluginManagerLeft(leaf, this)
			);
		if (this.settings.statusBarIcon && this.settings.watchtowerPlugin) {
			const container = this.addStatusBarItem();
			this.statusBarRoot = renderStatusBarView(container, this);
		}
		// 挂载插件设置页面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));
	}
	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_FILE_SUPERVISION);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PLUGIN_MANAGER);
		if (this.statusBarRoot && this.settings.watchtowerPlugin) {
			this.statusBarRoot.unmount();
		}
		if (this.taskScheduler) {
			this.taskScheduler.destroy();
		}
	}

	private registerCommands() {
		const fetcher = new PluginFetcher();
		const installer = new PluginInstaller(this);

		this.addCommand({
			id: "check-updates",
			name: "检查所有插件更新",
			callback: async () => {
				// @ts-ignore
				const manifests = this.app.plugins.manifests;
				const pluginIds = Object.keys(manifests);
				let updateCount = 0;

				for (const id of pluginIds) {
					const latest = await fetcher.getLatestVersion(id);
					const current = manifests[id]?.version;
					if (latest && current && latest !== current) {
						updateCount++;
						new Notice(
							`${manifests[id].name}: ${current} → ${latest}`,
							3000
						);
					}
				}

				if (updateCount === 0) {
					new Notice("所有插件均为最新版本");
				} else {
					new Notice(`发现 ${updateCount} 个插件可更新`);
				}
			},
		});

		this.addCommand({
			id: "update-plugin",
			name: "更新指定插件",
			callback: async () => {
				// @ts-ignore
				const manifests = this.app.plugins.manifests;
				const pluginIds = Object.keys(manifests);

				for (const id of pluginIds) {
					const latest = await fetcher.getLatestVersion(id);
					const current = manifests[id]?.version;
					if (latest && current && latest !== current) {
						const success = await installer.installFromUrl(
							`https://github.com/${id}`
						);
						if (success) {
							new Notice(`${manifests[id].name} 更新成功`);
						}
					}
				}
			},
		});

		this.addCommand({
			id: "batch-update",
			name: "批量更新所有可更新插件",
			callback: async () => {
				// @ts-ignore
				const manifests = this.app.plugins.manifests;
				const pluginIds = Object.keys(manifests);
				let updatedCount = 0;

				new Notice("开始批量检查更新...");

				for (const id of pluginIds) {
					const latest = await fetcher.getLatestVersion(id);
					const current = manifests[id]?.version;
					if (latest && current && latest !== current) {
						const success = await installer.installFromUrl(
							`https://github.com/${id}`
						);
						if (success) {
							updatedCount++;
						}
					}
				}

				new Notice(
					updatedCount > 0
						? `批量更新完成，共更新 ${updatedCount} 个插件`
						: "所有插件均为最新版本"
				);
			},
		});
	}
	private async loadSettingsDataFile(
		configFileName: ConfigFileName
	): Promise<void> {
		const fileService = FileService.getInstance(this);
		try {
			// 通过类型映射获取具体类型
			type DataType = ConfigFileMap[typeof configFileName];
			const data = await fileService.readFile<DataType>(configFileName);
			if (data) {
				// 根据类型执行差异化处理
				if (configFileName === CONFIG_FILES.FILE_STATE_DATA) {
					this.fileSupervision = data;
				}
			}
		} catch (error) {
			console.error(`读取 ${configFileName} 失败:`, error);
		}
	}
	async onExternalSettingsChange() {
		await loadSettings(this);
		await this.loadSettingsDataFile(CONFIG_FILES.FILE_STATE_DATA);
		await init(this);
		getAllPlugins();
	}
}
