import { Provider, useSelector } from "react-redux";
import { RootState, store } from "../store";
import { createRoot } from "react-dom/client";
import { activateView } from "../functions"; // 确保路径正确
import WatchtowerPlugin from "src/main";

export const StatusBarView: React.FC<{ container: HTMLElement; plugin: WatchtowerPlugin }> = ({ container, plugin }) => {
    // 使用 useSelector 获取 differentFiles 状态
    const differentFiles = useSelector((state: RootState) => state.counter.differentFiles);
    const files = differentFiles;

    async function HandleClick() {
        await activateView(plugin);
    }

    return (
        <div 
            className={files.length > 0 ? "Watchtower-status-bar-item is-dirty" : "Watchtower-status-bar-item"}
            onClick={HandleClick} // 直接使用 HandleClick 函数
        >
            {files.length > 0 ? `变动文件：${files.length}` : "文件完整"}
        </div>
    );
};


export function renderStatusBarView(container: HTMLElement, plugin: WatchtowerPlugin) {
    const root = createRoot(container);
    root.render(
        <Provider store={store}>
            <StatusBarView container={container} plugin={plugin} /> {/* 传递 plugin 实例 */}
        </Provider>
    );
}