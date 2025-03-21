import WatchtowerPlugin from "src/main";
import { VIEW_TYPE_PLUGIN_MANAGER } from "./PMleft";


/** 
 * 激活中间区域的视图。
 * 在中间区域左右分屏打开标签页
 *  */
export async function activateMiddleView(plugin: WatchtowerPlugin) {
    // 获取右侧叶子 - 指定vertical方向分屏
    const rightLeaf = plugin.app.workspace.getLeaf('split', 'vertical');
    await rightLeaf.setViewState({
        type: VIEW_TYPE_PLUGIN_MANAGER,
        active: true,
    });
}