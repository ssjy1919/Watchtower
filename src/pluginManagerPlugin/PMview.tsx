import WatchtowerPlugin from "src/main";
import { PluginHandler } from "./PMhandler";
import { IPlugin } from "./PMhandler";
import { Switch } from "src/setting/components/Switch";
import "./PMview.css"
import { useDispatch } from "react-redux";
import { RootState, setSettings } from "src/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { PluginManager } from "src/types";
import { Notice } from "obsidian";

interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const pluginHandler = new PluginHandler(plugin);
    const settings = useSelector((state: RootState) => state.settings);
    const getEnabledPlugins = settings.pluginManager.filter(p => p.enabled).length;
    const getDisabledPlugins = settings.pluginManager.filter(p => !p.enabled).length;
    const dispatch = useDispatch();


    useEffect(() => {
        const nallPlugins = pluginHandler.getAllPlugins();
        plugin.settings.pluginManager = nallPlugins;
        dispatch(setSettings(plugin.settings));
    }, [dispatch]);

    /**处理开关 */
    const handleChange = async (iPlugin: IPlugin) => {

        const updatedPlugins = plugin.settings.pluginManager.map(p => {
            if (p.id === iPlugin.id) {

                return {
                    ...p,
                    enabled: !iPlugin.enabled,
                    switchTime: new Date().getTime(),
                };
            }
            return p;
        });

        updatedPlugins.forEach(async (p) => {
            if (p.id === iPlugin.id) {
                if (iPlugin.enabled) {
                    pluginHandler.disablePlugin(iPlugin.id);
                } else if (!iPlugin.enabled && p.delayStart > 0) {
                    //@ts-ignore
                    app.plugins.enablePlugin(iPlugin.id);
                    p.enabled = true;
                } else if (!iPlugin.enabled && p.delayStart <= 0) {
                    pluginHandler.enablePlugin(iPlugin.id);

                }
            }
        });


        plugin.settings.pluginManager = updatedPlugins;
        dispatch(setSettings(plugin.settings));
        // 保存数据到插件存储
        await plugin.saveData(plugin.settings);

    }
    /**处理延时启动*/
    const handleDelayStartChange = async (iPlugin: IPlugin, newDelayStart: number) => {
        const updatedPlugins = plugin.settings.pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    delayStart: newDelayStart || 0,
                };
            }
            return p;
        });
        plugin.settings.pluginManager = updatedPlugins;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
        if (newDelayStart > 0) {
            if (iPlugin.enabled) {
                //用户设置的延时时间大于0且插件处于启用状态时，禁用插件后再用disablePlugin临时启动
                pluginHandler.disablePlugin(iPlugin.id);
                //@ts-ignore
                app.plugins.enablePlugin(iPlugin.id)
            }
            new Notice(`${iPlugin.name} 插件会在 obsidian 启动后的 ${newDelayStart} 秒启动，要完全关闭插件请将延时清零再关闭插件`);

        } else {
            if (iPlugin.enabled)
                //启动并保存插件信息
                pluginHandler.enablePlugin(iPlugin.id);
        }
    }
    // 处理备注
    const handleCommentChange = async (iPlugin: IPlugin, newComment: string) => {
        const updatedPlugins = plugin.settings.pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    comment: newComment,
                };
            }
            return p;
        });
        plugin.settings.pluginManager = updatedPlugins;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
    }

    const handleSettingClick = (iPlugin: IPlugin) => {
        pluginHandler.openPluginSettings(iPlugin.id)
    }


    // 处理下拉菜单排序选择（保留，用于内部调用）
    const handleSortChange = (field: keyof PluginManager, order: string) => {
        const newSortField = order === ""
            ? { field: null, order: null }
            : { field, order: order as "asc" | "desc" };

        const updatedSettings = { ...settings, sortField: newSortField };

        // 更新插件配置和 Redux 状态
        plugin.settings = updatedSettings;
        dispatch(setSettings(updatedSettings));
        plugin.saveData(updatedSettings);
    };

    // 点击表头时循环切换排序状态
    const handleHeaderClick = (field: keyof PluginManager) => {
        let newOrder: "asc" | "desc" | "" = "";
        if (settings.sortField.field !== field || !settings.sortField.order) {
            newOrder = "asc";
        } else if (settings.sortField.order === "asc") {
            newOrder = "desc";
        } else if (settings.sortField.order === "desc") {
            newOrder = "";
        }
        handleSortChange(field, newOrder);
    };

    // 根据排序状态返回排序后的列表
    const sortedPlugins = (settings.sortField.field && settings.sortField.order)
        ? (() => {
            const sortField = settings.sortField.field as keyof PluginManager;
            return [...settings.pluginManager].sort((a, b) => {
                let aVal = a[sortField] ?? "";
                let bVal = b[sortField] ?? "";
                if (sortField === "enabled") {
                    aVal = a.enabled ? 1 : 0;
                    bVal = b.enabled ? 1 : 0;
                }

                // 主排序逻辑
                if (aVal > bVal) return settings.sortField.order === "asc" ? 1 : -1;
                if (aVal < bVal) return settings.sortField.order === "asc" ? -1 : 1;

                // 相等时按name二次排序
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) return 1;
                if (aName < bName) return -1;
                return 0;
            });
        })()
        : settings.pluginManager;

    return (
        <div className="PluginManagerView">
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleHeaderClick('name')} >
                            一共{plugin.settings.pluginManager.length}个插件，开启{getEnabledPlugins}关闭{getDisabledPlugins}{" "}
                            {settings.sortField.field === "name" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "name" && settings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('enabled')} >
                            状态{" "}
                            {settings.sortField.field === "enabled" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "enabled" && settings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('delayStart')} >
                            延时启动(秒)
                            {settings.sortField.field === "delayStart" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "delayStart" && settings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('switchTime')} >
                            开关时间{" "}
                            {settings.sortField.field === "switchTime" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "switchTime" && settings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('comment')} >
                            备注{" "}
                            {settings.sortField.field === "comment" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "comment" && settings.sortField.order === "desc" && "↓"}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPlugins.map((plugin) => (
                        <tr key={plugin.id}>
                            <td className={plugin.enabled ? "enabled" : ""} onClick={() => { handleSettingClick(plugin) }}>

                                <div className="plugin-name">
                                    <div>{plugin.name}</div>

                                    <div>{plugin.enabled ? "  ⚙️" : " "}<div className="version">{plugin.version}</div></div>
                                </div>

                            </td>
                            <td>{plugin.id != "watchtower" ? <Switch
                                label=""
                                description=""
                                value={plugin.enabled}
                                onChange={() => { handleChange(plugin) }}
                            /> : "⚪"}
                            </td>
                            <td>
                                {plugin.id != "watchtower" ?
                                    <input
                                        type="number"
                                        defaultValue={plugin.delayStart || 0}
                                        min="0"
                                        max="99999"
                                        onBlur={(e) => handleDelayStartChange(plugin, parseInt(e.target.value))}
                                    /> : "⚞⛒⚟"}
                            </td>
                            <td>
                                {pluginHandler.getSwitchTimeByPluginId(plugin.id) === 0
                                    ? 0
                                    : new Date(pluginHandler.getSwitchTimeByPluginId(plugin.id)).toLocaleString()}
                            </td>
                            <td>
                                <textarea
                                    defaultValue={plugin.comment === "" ? plugin.description : plugin.comment}
                                    placeholder={plugin.description}
                                    rows={2}
                                    onBlur={(e) => handleCommentChange(plugin, e.target.value)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PluginManagerView;