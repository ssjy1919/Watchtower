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
    const stoerSettings = useSelector((state: RootState) => state.settings);
    const getEnabledPlugins = stoerSettings.pluginManager.filter(p => p.enabled).length;
    const getDisabledPlugins = stoerSettings.pluginManager.filter(p => !p.enabled).length;
    const dispatch = useDispatch();
    /**处理开关 */
    const handleChange = async (iPlugin: IPlugin) => {
        const updatedPlugins = stoerSettings.pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    enabled: !iPlugin.enabled,
                    switchTime: new Date().getTime(),
                };
            }
            return p;
        });
        //  单独用 forEach 处理调用逻辑， 如果和上面的 map 合并，调试时容易看蒙
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
        const newSettings = { ...plugin.settings, pluginManager: updatedPlugins };

        plugin.settings = newSettings;
        dispatch(setSettings(newSettings));
        // 保存数据到插件存储
        await plugin.saveData(newSettings);

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
        if (newDelayStart > 0) {
            if (iPlugin.enabled) {
                //用户设置的延时时间大于0且插件处于启用状态时，禁用插件通知ob后再用disablePlugin临时启动
                pluginHandler.disablePlugin(iPlugin.id);
                //@ts-ignore
                app.plugins.enablePlugin(iPlugin.id);
            }
        } else {
            if (iPlugin.enabled)
                //启动并保存插件信息
                pluginHandler.enablePlugin(iPlugin.id);
        }
        plugin.settings.pluginManager = updatedPlugins;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
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


    // 处理排序选择（保留，用于内部调用）
    const handleSortChange = (field: keyof PluginManager, order: string) => {
        const newSortField = order === ""
            ? { field: null, order: null }
            : { field, order: order as "asc" | "desc" };

        const updatedSettings = { ...stoerSettings, sortField: newSortField };

        // 更新插件配置和 Redux 状态
        plugin.settings = updatedSettings;
        dispatch(setSettings(updatedSettings));
        plugin.saveData(updatedSettings);
    };

    // 点击表头时循环切换排序状态
    const handleHeaderClick = (field: keyof PluginManager) => {
        let newOrder: "asc" | "desc" | "" = "";
        if (stoerSettings.sortField.field !== field || !stoerSettings.sortField.order) {
            newOrder = "asc";
        } else if (stoerSettings.sortField.order === "asc") {
            newOrder = "desc";
        } else if (stoerSettings.sortField.order === "desc") {
            newOrder = "";
        }
        handleSortChange(field, newOrder);
    };

    // 根据排序状态返回排序后的列表
    const sortedPlugins = (stoerSettings.sortField.field && stoerSettings.sortField.order)
        ? (() => {
            const sortField = stoerSettings.sortField.field as keyof PluginManager;
            return [...stoerSettings.pluginManager].sort((a, b) => {
                let aVal = a[sortField] ?? "";
                let bVal = b[sortField] ?? "";
                if (sortField === "enabled") {
                    aVal = a.enabled ? 1 : 0;
                    bVal = b.enabled ? 1 : 0;
                }

                // 主排序逻辑
                if (aVal > bVal) return stoerSettings.sortField.order === "asc" ? 1 : -1;
                if (aVal < bVal) return stoerSettings.sortField.order === "asc" ? -1 : 1;

                // 相等时按name二次排序
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) return 1;
                if (aName < bName) return -1;
                return 0;
            });
        })()
        : stoerSettings.pluginManager;

    return (
        <div className="PluginManagerView">
            <table>
                <thead>
                    <tr>
                        <th onClick={() => handleHeaderClick('name')} >
                            一共{plugin.settings.pluginManager.length}个插件，开启{getEnabledPlugins}关闭{getDisabledPlugins}{" "}
                            {stoerSettings.sortField.field === "name" && stoerSettings.sortField.order === "asc" && "↑"}
                            {stoerSettings.sortField.field === "name" && stoerSettings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('enabled')} >
                            状态{" "}
                            {stoerSettings.sortField.field === "enabled" && stoerSettings.sortField.order === "asc" && "↑"}
                            {stoerSettings.sortField.field === "enabled" && stoerSettings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('delayStart')} >
                            延时启动(秒)
                            {stoerSettings.sortField.field === "delayStart" && stoerSettings.sortField.order === "asc" && "↑"}
                            {stoerSettings.sortField.field === "delayStart" && stoerSettings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('switchTime')} >
                            开关时间{" "}
                            {stoerSettings.sortField.field === "switchTime" && stoerSettings.sortField.order === "asc" && "↑"}
                            {stoerSettings.sortField.field === "switchTime" && stoerSettings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('comment')} >
                            备注{" "}
                            {stoerSettings.sortField.field === "comment" && stoerSettings.sortField.order === "asc" && "↑"}
                            {stoerSettings.sortField.field === "comment" && stoerSettings.sortField.order === "desc" && "↓"}
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