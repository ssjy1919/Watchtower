import WatchtowerPlugin from "src/main";
import { PluginHandler } from "./PMhandler";
import { IPlugin } from "./PMhandler";
import { Switch } from "src/setting/components/Switch";
import "./PMview.css"
import { useDispatch } from "react-redux";
import { RootState, setSettings } from "src/store";
import { useSelector } from "react-redux";
import { PluginManager } from "src/types";

interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const pluginHandler = new PluginHandler(plugin);
    const storeSettings = useSelector((state: RootState) => state.settings);
    const pluginManager = storeSettings.pluginManager;
    const getEnabledPlugins = pluginManager.filter(p => p.enabled).length;
    const getDisabledPlugins = pluginManager.filter(p => !p.enabled).length;
    const storeField = storeSettings.sortField.field;
    const storeOrder = storeSettings.sortField.order;
    const dispatch = useDispatch();    
    /**处理开关 */
    const handleChange = async (iPlugin: IPlugin) => {
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    enabled: !iPlugin.enabled,
                    switchTime: new Date().getTime(),
                };
            }
            return p;
        });

        updatedPlugins.forEach(p => {
            if (p.id === iPlugin.id) {
                if (iPlugin.enabled) {
                    pluginHandler.disablePlugin(iPlugin.id);
                } else if (!iPlugin.enabled && p.delayStart > 0) {
                    //@ts-ignore
                    app.plugins.enablePlugin(iPlugin.id);
                } else if (!iPlugin.enabled && p.delayStart <= 0) {
                    pluginHandler.enablePlugin(iPlugin.id);

                }
            }
        });

        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        dispatch(setSettings(newSettings));
        // 保存数据到插件存储
        await plugin.saveData(newSettings);

    }
    /**处理延时启动*/
    const handleDelayStartChange = async (iPlugin: IPlugin, newDelayStart: number) => {
        //记录到设置的启动状态，下次重启obsidian使用这个配置显示
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    delayStart: newDelayStart || 0,
                    switchTime: new Date().getTime(),
                    enabled: newDelayStart ? false : true,
                };
            } else {
                return {
                    ...p,
                    // 避免写入配置时被真实插件状态覆盖
                    enabled: p.delayStart ? false : true,
                };
            }
        });
        //配置给store用于显示的启动状态，用户更改延迟时间，避免开关被关闭
        const upStoreDatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    delayStart: newDelayStart || 0,
                    switchTime: new Date().getTime(),
                    enabled: iPlugin.enabled,
                };
            }
            return p;
        });
        if (newDelayStart > 0) {
            if (iPlugin.enabled) {
                //用户设置的延时时间大于0且插件处于启用状态时，通知ob禁用插件后再用disablePlugin临时启动
                pluginHandler.disablePlugin(iPlugin.id);
                //@ts-ignore
                app.plugins.enablePlugin(iPlugin.id);
            }
        } else {
            if (iPlugin.enabled)
                //通知ob启动插件，并保存插件信息
                pluginHandler.enablePlugin(iPlugin.id);
        }
        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        await plugin.saveData(newSettings);
        const newStoreSettings = { ...storeSettings, pluginManager: upStoreDatedPlugins };
        dispatch(setSettings(newStoreSettings));
    }
    // 处理备注
    const handleCommentChange = async (iPlugin: IPlugin, newComment: string) => {
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    comment: newComment,
                    switchTime: new Date().getTime(),
                };
            }
            return p;
        });
        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
    }

    const handleSettingClick = async (iPlugin: IPlugin) => {
        pluginHandler.openPluginSettings(iPlugin.id);
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    switchTime: new Date().getTime(),
                };
            }
            return p;
        });
        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);

    }
    // 处理下拉菜单排序选择（保留，用于内部调用）
    const handleSortChange = (field: keyof PluginManager, order: string) => {
        const newSortField = order === ""
            ? { field: null, order: null }
            : { field, order: order as "asc" | "desc" };

        const updatedSettings = { ...storeSettings, sortField: newSortField };

        // 更新插件配置和 Redux 状态
        plugin.settings = updatedSettings;
        dispatch(setSettings(updatedSettings));
        plugin.saveData(updatedSettings);
    };

    // 循环切换排序状态
    const handleHeaderClick = (field: keyof PluginManager) => {
        let newOrder: "asc" | "desc" | "" = "";
        if (storeField !== field || !storeOrder) {
            newOrder = "asc";
        } else if (storeOrder === "asc") {
            newOrder = "desc";
        } else if (storeOrder === "desc") {
            newOrder = "";
        }
        handleSortChange(field, newOrder);
    };

    // 根据排序状态返回排序后的列表
    const sortedPlugins = (storeField && storeOrder)
        ? (() => {
            const sortField = storeField as keyof PluginManager;
            return [...storeSettings.pluginManager].sort((a, b) => {
                let aVal = a[sortField] ?? "";
                let bVal = b[sortField] ?? "";
                if (sortField === "enabled") {
                    aVal = a.enabled ? 1 : 0;
                    bVal = b.enabled ? 1 : 0;
                }
                // 主排序逻辑
                if (aVal > bVal) return storeOrder === "asc" ? 1 : -1;
                if (aVal < bVal) return storeOrder === "asc" ? -1 : 1;

                // 相等时按name二次排序
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) return 1;
                if (aName < bName) return -1;
                return 0;
            });
        })()
        : storeSettings.pluginManager;

    return (
        <div className="PluginManagerView">
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleHeaderClick('name')} >
                            一共{pluginManager.length}个插件，开启{getEnabledPlugins}关闭{getDisabledPlugins}{" "}
                            {storeField === "name" && storeOrder === "asc" && "↑"}
                            {storeField === "name" && storeOrder === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('enabled')} >
                            状态{" "}
                            {storeField === "enabled" && storeOrder === "asc" && "↑"}
                            {storeField === "enabled" && storeOrder === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('delayStart')} >
                            延时启动(秒)
                            {storeField === "delayStart" && storeOrder === "asc" && "↑"}
                            {storeField === "delayStart" && storeOrder === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('switchTime')} >
                            更改时间{" "}
                            {storeField === "switchTime" && storeOrder === "asc" && "↑"}
                            {storeField === "switchTime" && storeOrder === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('comment')} >
                            备注{" "}
                            {storeField === "comment" && storeOrder === "asc" && "↑"}
                            {storeField === "comment" && storeOrder === "desc" && "↓"}
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
                                    /> : "0"}
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