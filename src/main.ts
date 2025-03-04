import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './view/leafView';
import { DEFAULT_SETTINGS, WatchtowerSettings } from './types';
import { WatchtowerSettingTab } from './view/settingTab';

export default class WatchtowerPlugin extends Plugin {
  settings: WatchtowerSettings;
  async onload() {
    // 加载设置
    await this.loadSettings(); 
    this.registerView(
      VIEW_TYPE_EXAMPLE,
      (leaf) => new ExampleView(leaf)
    );
    this.addRibbonIcon('dice', '文件状态', () => {
      this.activateView();
    });
    this.addCommand({
			//设置这个命令的ID
			id: 'WatchtowerLeafView',
			//设置这个命令的名字
			name: '打开Watchtower侧边视图',
			callback: async () => {
				this.activateView();
			}
		});
    // 这里挂载插件设置的页面视图，设置的页面视图可以让用户配置插件的各个方面
    this.addSettingTab(new WatchtowerSettingTab(this.app, this));
    
    // new CodeFenceProcessor(this.app, this, this.settings);



    //由于用户与指向设备（如鼠标）交互而发生的事件。常见的事件使用该接口包括点击，点击，鼠标向上，鼠标向下
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	// console.log('click', evt);
		// });

  }

  
	//当你的插件被禁用或者Obsidian应用关闭时，这个函数会被调用。
  async onunload() {
  }


  async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
        await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
      }
    }

    // "Reveal" the leaf in case it is in a collapsed sidebar
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}