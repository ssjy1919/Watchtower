import { Provider, useSelector } from "react-redux";
import { RootState, store } from "../store";
import { createRoot } from "react-dom/client";
import WatchtowerPlugin from "src/main";
import { activateView } from "src/watchtowerPlugin/toolsFC";

export const StatusBarView: React.FC<{ container: HTMLElement; plugin: WatchtowerPlugin }> = ({ container, plugin }) => {
    // 使用 useSelector 获取 differentFiles 状态
    const differentFiles = useSelector((state: RootState) => state.counter.differentFiles);
    const files = differentFiles;

    async function HandleClick() {
        await activateView(plugin);
    }

    return (
        <div 
            className={files.length > 0 ? "watchtowerPlugin-status-bar-item is-dirty" : "watchtowerPlugin-status-bar-item"}
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