import { Provider, useSelector } from "react-redux";
import { RootState, store } from "../../store";
import { createRoot } from "react-dom/client";
import WatchtowerPlugin from "src/main";
import { activateView } from "src/watchtowerPlugin/toolsFC";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { Menu, Notice } from "obsidian"; // 引入 Obsidian 的 Menu API
import { activateMiddleView } from "src/pluginManagerPlugin/PMtools";

export const StatusBarView: React.FC<{ container: HTMLElement; plugin: WatchtowerPlugin }> = ({ container, plugin }) => {
    const stoerSettings = useSelector((state: RootState) => state.settings);
    const differentFiles = stoerSettings.fileStats.filter((file) => file.differents !== "");
        const dispatch = useDispatch();

    useEffect(() => {
        // 可以在这里处理副作用逻辑
    }, [dispatch, differentFiles]);

    // 点击状态栏时显示菜单
    const handleMenu = (event: React.MouseEvent) => {
        event.preventDefault(); // 阻止默认行为

        // 创建右键菜单
        const menu = new Menu();

        // 添加菜单项：刷新文件状态
        menu.addItem((item) => {
            item.setTitle("打开历史文件")
                .setIcon("telescope")
                .onClick(async () => {
                    await activateView(plugin);
                });
        });
        // 添加菜单项：保存文件信息
        menu.addItem((item) => {
            item.setTitle("保存文件信息")
                .setIcon("save")
                .onClick(async () => {
                    await activateView(plugin);
                    try {
                        // 保存文件信息并获取最新数据
                        await plugin.fileHandler.saveFileInfo();
                        // 提示用户保存成功
                        new Notice("文件信息已保存！");
                    } catch (error) {
                        console.error("保存文件信息失败：", error);
                        new Notice("保存文件信息失败，请检查控制台日志。");
                    }
                });
        });
        menu.addItem((item) => {
            item.setTitle("打开插件管理")
                .setIcon("blocks")
                .onClick(async () => {
                    activateMiddleView(plugin);
                });
        });
        // 显示菜单
        menu.showAtMouseEvent(event.nativeEvent);
    };

    return (
        <div
            className={differentFiles.length > 0 ? "watchtowerPlugin-status-bar-item is-dirty" : "watchtowerPlugin-status-bar-item"}
            onClick={handleMenu} // 绑定点击事件
        >
            {differentFiles.length > 0 ? `变动文件：${differentFiles.length}` : "文件完整"}
        </div>
    );
};

export function renderStatusBarView(container: HTMLElement, plugin: WatchtowerPlugin) {
    const root = createRoot(container);
    root.render(
        <Provider store={store}>
            <StatusBarView container={container} plugin={plugin} />
        </Provider>
    );
}