import { Plugin } from "obsidian";
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
export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileSupervision: FileSupervisionData;
	public fileHandler: FileHandler;
	private statusBarRoot?: import("react-dom/client").Root;
	async onload() {
		// 加载设置
		await loadSettings(this);
		FileService.getInstance(this);
		// 加载 JSON 文件
		await this.loadSettingsDataFile(CONFIG_FILES.FILE_STATE_DATA);
		store.dispatch(updataFSstates(this.fileSupervision));
		store.dispatch(updataSettings(this.settings));
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
