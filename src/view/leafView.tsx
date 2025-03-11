
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import FileSupervision from "./fileSupervision"
import { Provider } from 'react-redux';
import { store } from '../store';
import { AppContext, FileHandlerContext } from 'src/context';
import WatchtowerPlugin from 'src/main';

export const VIEW_TYPE_FILE_SUPERVISION = 'example-view';
export class ExampleView extends ItemView {
    root: Root | null = null;
    plugin: WatchtowerPlugin; // 显式声明 plugin 属性

    constructor(leaf: WorkspaceLeaf, plugin: WatchtowerPlugin) {
        super(leaf);
        this.plugin = plugin; // 初始化 plugin 属性
    }
    //设置icon
    getIcon() {
        return 'telescope';
    }
    getViewType() {
        return VIEW_TYPE_FILE_SUPERVISION;
    }

    getDisplayText() {
        return '瞭望台';
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <Provider store={store}>
                <AppContext.Provider value={this.plugin.app}>
                    <FileHandlerContext.Provider value={{ saveFileInfo: this.plugin.fileHandler.saveFileInfo }}>
                        <FileSupervision />
                    </FileHandlerContext.Provider>
                </AppContext.Provider>
            </Provider>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}