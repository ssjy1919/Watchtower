
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import ReactView from "./ReactView"
import { Provider } from 'react-redux';
import { store } from '../store';
import { FileHandlerContext } from 'src/context';
import WatchtowerPlugin from 'src/main';

export const VIEW_TYPE_EXAMPLE = 'example-view';
export class ExampleView extends ItemView {
    root: Root | null = null;
    plugin: WatchtowerPlugin; // 显式声明 plugin 属性

    constructor(leaf: WorkspaceLeaf, plugin: WatchtowerPlugin) {
        super(leaf);
        this.plugin = plugin; // 初始化 plugin 属性
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return 'Example view';
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <Provider store={store}>
                <FileHandlerContext.Provider value={{ saveFileInfo: this.plugin.fileHandler.saveFileInfo }}>
                    <ReactView />
                </FileHandlerContext.Provider>
            </Provider>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}