import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import WatchtowerPlugin from "src/main";
import { store } from "src/store";
import PluginManagerView from "./PluginManagerView";



export const VIEW_TYPE_PLUGIN_MANAGER = 'plugin-manager-left-view';
export class PluginManagerLeft extends ItemView {
    root: Root | null = null;
    plugin: WatchtowerPlugin; 
    constructor(leaf: WorkspaceLeaf, plugin: WatchtowerPlugin) {
        super(leaf);
        this.plugin = plugin;
    }
    //设置icon
    getIcon() {
        return 'blocks';
    }
    getViewType() {
        return VIEW_TYPE_PLUGIN_MANAGER;
    }

    getDisplayText() {
        return '插件管理';
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <Provider store={store}>
                <PluginManagerView plugin={this.plugin} />
            </Provider>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

