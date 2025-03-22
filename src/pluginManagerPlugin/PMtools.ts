    import WatchtowerPlugin from "src/main";
    import { VIEW_TYPE_PLUGIN_MANAGER } from "./PMleft";
import { WorkspaceLeaf } from "obsidian";
    
    /** 
     * 激活中间区域的视图。
     * 在中间区域左右分屏打开标签页。
     * 如果已有相同类型的视图打开，则直接激活该视图。
     */
    export async function activateMiddleView(plugin: WatchtowerPlugin) {
        const { workspace } = plugin.app;
    
        // 使用 iterateAllLeaves 遍历所有叶子节点，检查是否已有目标视图类型打开
        let existingLeaf: WorkspaceLeaf | undefined;
        workspace.iterateAllLeaves((leaf) => {
            if (leaf.view.getViewType() === VIEW_TYPE_PLUGIN_MANAGER) {
                existingLeaf = leaf;
            }
        });
    
        if (existingLeaf) {
            // 如果找到已打开的视图，直接激活它
            workspace.setActiveLeaf(existingLeaf);
            return;
        }
    
        // 如果没有找到，创建一个新的叶子并设置视图状态
        const rightLeaf = workspace.getLeaf('split', 'vertical');
        await rightLeaf.setViewState({
            type: VIEW_TYPE_PLUGIN_MANAGER,
            active: true,
        });
    }