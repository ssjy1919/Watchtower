
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { ReactView } from './ReactView';
import { AppContext } from '../context';
import { Provider } from 'react-redux';
import { store } from '../store';

export const VIEW_TYPE_EXAMPLE = 'example-view';
export class ExampleView extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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
                <AppContext.Provider value={this.app}>
                    <ReactView />
                </AppContext.Provider>
            </Provider>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}