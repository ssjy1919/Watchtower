import WatchtowerPlugin from "src/main";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./PMleft";

/** 激活中间区域的视图 */
export async function activateMiddleView(plugin: WatchtowerPlugin) {
    // 获取一个中间区域的叶子, false 表示不在侧边栏中
    const leaf = plugin.app.workspace.getLeaf(false); 
    await leaf.setViewState({
        type: VIEW_TYPE_PLUGIN_MANAGER,
        active: true,
    });
     // 设置为活动叶子
    plugin.app.workspace.setActiveLeaf(leaf);
}

