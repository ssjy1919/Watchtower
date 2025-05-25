import { Notice, Plugin } from "obsidian";
import { CONFIG_FILES, ConfigFileName, WatchtowerSettings } from "./types";
import { WatchtowerSettingTab } from "./setting/settingTab";
import { FileHandler } from "./watchtowerPlugin/fileHandler";
import { init, loadSettings } from "./watchtowerPlugin/toolsFC";
import { WatchtowerMain } from "./watchtowerPlugin/WatchtowerMian";
import {
	File_supervision,
	VIEW_TYPE_FILE_SUPERVISION,
} from "./watchtowerPlugin/view/leafView";
import { PluginManagerPlugin } from "./pluginManagerPlugin/PluginManagerMain";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./pluginManagerPlugin/PluginManagerLeft";
import { getAllPlugins } from "./pluginManagerPlugin/PMtools";
import { renderStatusBarView } from "./watchtowerPlugin/view/statusBarView";
import { FileService } from "./FileService";

export default class WatchtowerPlugin extends Plugin {
	public settings: WatchtowerSettings;
	public fileHandler: FileHandler;
	private statusBarRoot?: import("react-dom/client").Root;

	async onload() {
		// 加载设置
		await loadSettings(this);
		FileService.getInstance(this);
		// 等待应用初始化完成
		this.app.workspace.onLayoutReady(() => {
			this.fileHandler = new FileHandler(this);
			init(this);
			if (this.settings.watchtowerPlugin) {
				const watchtowerMain = new WatchtowerMain(this);
				watchtowerMain.initialize();
			}
			if (this.settings.pluginManagerPlugin) {
				new PluginManagerPlugin(this);
			}

			// 新增：加载 newdata.JSON 文件
			this.loadNewDataFile(CONFIG_FILES.FILE_SUPERVISION);
		});
		if (this.settings.watchtowerPlugin) {
			this.registerView(
				VIEW_TYPE_FILE_SUPERVISION,
				(leaf) => new File_supervision(leaf, this)
			);
		}
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
	private async loadNewDataFile(
		configFileName: ConfigFileName
	): Promise<void> {
		const fileService = FileService.getInstance(this);
		try {
			const data = await fileService.readFile<any>(configFileName);
			if (data) {
				console.log(`成功加载 ${configFileName}:`, data);
				// 根据不同文件执行差异化处理
				if (configFileName === CONFIG_FILES.FILE_SUPERVISION) {
					this.settings.fileSupervision = data;
				}
				// 可扩展其他文件类型...else if (configFileName === CONFIG_FILES.NEW_DATA)
			}
		} catch (error) {
			console.error(`读取 ${configFileName} 失败:`, error);
		}
	}
	async onExternalSettingsChange() {
		new Notice("Watchtower：插件配置被大量修改,重载插件配置。");
		await loadSettings(this);
		init(this);
		getAllPlugins();
		new Notice("Watchtower：重载完毕。", 10000);
	}
}
