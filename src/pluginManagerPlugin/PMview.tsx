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

interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const pluginHandler = new PluginHandler(plugin);
    const settings = useSelector((state: RootState) => state.settings);

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
        plugin.settings.pluginManager = updatedPlugins;
        dispatch(setSettings(plugin.settings));
        // 保存数据到插件存储
        await plugin.saveData(plugin.settings);
        if (iPlugin.enabled) {
            pluginHandler.disablePlugin(iPlugin.id);
        } else {
            pluginHandler.enablePlugin(iPlugin.id);
        }
    }

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
                if (aVal > bVal) return settings.sortField.order === "asc" ? 1 : -1;
                if (aVal < bVal) return settings.sortField.order === "asc" ? -1 : 1;
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
                            插件名称{" "}
                            {settings.sortField.field === "name" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "name" && settings.sortField.order === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('enabled')} >
                            状态{" "}
                            {settings.sortField.field === "enabled" && settings.sortField.order === "asc" && "↑"}
                            {settings.sortField.field === "enabled" && settings.sortField.order === "desc" && "↓"}
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
                            {/* @ts-ignore */}
                            <td className={plugin.enabled ? "enabled" : ""}  onClick={() => { handleSettingClick(plugin) }}>
                                {/* @ts-ignore */}
                                {plugin.name}{plugin.enabled ? "  ⚙️" : " "}
                            </td>
                            <td>{plugin.id !== "watchtowerPlugin" ? <Switch
                                label=""
                                description=""
                                value={plugin.enabled}
                                onChange={() => { handleChange(plugin) }}
                            /> : ""}
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