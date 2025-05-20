
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import FileSupervision from "./fileSupervisionView"
import { Provider } from 'react-redux';
import { store } from '../../store';
import WatchtowerPlugin from 'src/main';
import "./leafView.css"
export const VIEW_TYPE_FILE_SUPERVISION = 'file-supervision-left-view';
export class File_supervision extends ItemView {
    root: Root | null = null;
    plugin: WatchtowerPlugin; // 显式声明 plugin 属性
    constructor(leaf: WorkspaceLeaf, plugin: WatchtowerPlugin) {
        super(leaf);
        this.plugin = plugin;

    }
    //设置icon
    getIcon() {
        return 'telescope';
    }
    getViewType() {
        return VIEW_TYPE_FILE_SUPERVISION;
    }

    getDisplayText() {
        return '瞭望塔';
    }

    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <Provider store={store}>
                <FileSupervision plugin={this.plugin} />
            </Provider>
        );
        return Promise.resolve();
    }

    onClose() {
        this.root?.unmount();
        return Promise.resolve();
    }
}

