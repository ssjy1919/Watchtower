import { FileHandler } from "src/fileHandler";
import WatchtowerPlugin from "src/main";
import {
	activateView,
	init,
	registerFileEventHandlers,
} from "src/toolsFC";
import { renderStatusBarView } from "src/watchtowerPlugin/view/statusBarView";
import { File_supervision, VIEW_TYPE_FILE_SUPERVISION } from "./view/leafView";

export interface WatchtowerMain {
	plugin: WatchtowerPlugin;
}

export class WatchtowerMain {
	public plugin: WatchtowerPlugin;

	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
	}

	async initialize() {
		// 初始化 FileHandler
		this.plugin.fileHandler = new FileHandler(
			this.plugin.app,
			this.plugin.settings,
			this.plugin
		);

		// 数据初始化
		init(this.plugin);

		// 注册文件事件监听
		registerFileEventHandlers(this.plugin);

		this.plugin.addRibbonIcon("telescope", "瞭望塔", async () => {
			await activateView(this.plugin);
		});

        this.plugin.registerView(
            VIEW_TYPE_FILE_SUPERVISION,
            (leaf) => new File_supervision(leaf, this.plugin)
        );



		this.plugin.addCommand({
			id: "WatchtowerLeafView",
			name: "打开侧边视图",
			callback: async () => {
				await activateView(this.plugin);
			},
		});



		this.plugin.addCommand({
			id: "WatchtowerMark",
			name: "保存文件信息",
			callback: async () => {
				await this.plugin.fileHandler.saveFileInfo();
			},
		});

		// 添加状态栏项目
		const statusBarItemEl = this.plugin.addStatusBarItem();
		renderStatusBarView(statusBarItemEl, this.plugin);
	}
}
