import { Plugin, TAbstractFile, WorkspaceLeaf } from "obsidian";
import { ExampleView, VIEW_TYPE_EXAMPLE } from "./view/leafView";
import {
	DEFAULT_SETTINGS,
	settingsFileStats,
	WatchtowerSettings,
} from "./types";
import { WatchtowerSettingTab } from "./view/settingTab";
import { fileInfo, compareFileStats } from "./functions";
import { setFileChange, setSettings, setDifferentFiles, store } from "./store";

export default class WatchtowerPlugin extends Plugin {
	settings: WatchtowerSettings;
	async onload() {
		// 加载设置
		await this.loadSettings();
		store.dispatch(setSettings(this.settings));
		//等待应用初始化完成
		this.app.workspace.onLayoutReady(async () => {
			// 加载并比较文件信息
			const differentFiles = await compareFileStats(
				this.app,
				this.settings
			);
			store.dispatch(setDifferentFiles(differentFiles));
		});

		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));
		this.addRibbonIcon("dice", "文件状态", () => {
			this.activateView();
		});
		this.addCommand({
			//设置这个命令的ID
			id: "WatchtowerLeafView",
			//设置这个命令的名字
			name: "打开Watchtower侧边视图",
			callback: async () => {},
		});

		this.addCommand({
			//设置这个命令的ID
			id: "WatchtowerMark",
			//设置这个命令的名字
			name: "保存文件信息",
			callback: async () => {
				// 加载文件信息
				this.loadFileInfo();
				this.settings.markTime = new Date().toLocaleString();
				await this.saveSettings();
				store.dispatch(setSettings(this.settings));
				store.dispatch(setFileChange(true)); // 触发 setFileChange action
			},
		});

		// 这里挂载插件设置的页面视图，设置的页面视图可以让用户配置插件的各个方面
		this.addSettingTab(new WatchtowerSettingTab(this.app, this));

		// new CodeFenceProcessor(this.app, this, this.settings);
		//由于用户与指向设备（如鼠标）交互而发生的事件。常见的事件使用该接口包括点击，点击，鼠标向上，鼠标向下
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	// console.log('click', evt);
		// });

		/**
		 * 注册一个定时器，该定时器每5秒执行一次指定的操作。
		 * 当插件被禁用时，此函数会自动清除已注册的定时器。
		 */
		// this.registerInterval(
		//   window.setInterval(() =>{
		//     this.loadFileInfo();
		//     console.log(this.settings)}, 5 * 1000)
		// );

		// 文件事件监听
		this.registerFileEventHandlers();
	}
	// 注册文件事件处理程序
	registerFileEventHandlers() {
		const fileEventHandler = async (
			event: string,
			file: TAbstractFile,
			oldPath?: string
		) => {
			store.dispatch(setFileChange(true)); // 触发 setFileChange action
			// console.log(
			// 	`File ${event}: ${oldPath ? `${oldPath} -> ` : ""}${file.path}`
			// );
			// 加载并比较文件信息
			const differentFiles = await compareFileStats(
				this.app,
				this.settings
			);
			store.dispatch(setDifferentFiles(differentFiles));
			this.activateView();
		};
		this.app.vault.on("modify", (file) =>
			fileEventHandler("modified", file)
		);
		this.app.vault.on("delete", (file) =>
			fileEventHandler("deleted", file)
		);
		this.app.vault.on("rename", (file, oldPath) =>
			fileEventHandler("renamed", file, oldPath)
		);
		this.app.vault.on("create", (file) =>
			fileEventHandler("created", file)
		);
	}
	//当你的插件被禁用或者Obsidian应用关闭时，这个函数会被调用。
	async onunload() {}
	//加载用户在插件的设置页面调整的信息。
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	//保存用户在插件的设置页面调整的信息。
	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_EXAMPLE,
					active: true,
				});
			}
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
	loadFileInfo(): void {
		const fileInfoData = fileInfo(this.app);
		const fileStats: settingsFileStats[] = fileInfoData.map((file) => ({
			basename: file.basename,
			extension: file.basename,
			name: file.basename,
			path: file.path,
			stat: file.stat,
		}));

		this.settings = {
			...this.settings,
			fileStats,
			markTime: new Date().toISOString(),
			filePrefix: false,
			leafView: "",
		};
	}
}
