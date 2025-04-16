import WatchtowerPlugin from "src/main";
import { Switch } from "src/setting/components/Switch";
import "./PluginManagerView.css"
import { useDispatch } from "react-redux";
import { RootState, setSettings, updatePluginManager } from "src/store";
import { useSelector } from "react-redux";
import { PluginManager } from "src/types";
import { disablePlugin, enablePlugin, getSwitchTimeByPluginId, openPluginSettings } from "./PMtools";
import { useMemo } from "react";
import GroupView from "./GroupView";
import MakeTagsView from "./MakeTagsView";


interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const storeSettings = useSelector((state: RootState) => state.settings);
    const pluginManager = useSelector((state: RootState) => state.settings.pluginManager);
    const storeField = useSelector((state: RootState) => state.settings.sortField.field);
    const storeOrder = useSelector((state: RootState) => state.settings.sortField.order);
    const dispatch = useDispatch();
    // 根据 showPluginGroups 过滤插件列表
    const filteredPlugins = pluginManager.filter(plugin => {
        // 如果 showPluginGroups 为空，则显示所有插件
        if (!storeSettings.showPluginGroups) return true;
        // 否则仅显示 tags 包含 showPluginGroups 的插件
        return plugin.tags.includes(storeSettings.showPluginGroups);
    });
    // 计算属性建议用 useMemo 
    const [getEnabledPlugins, getDisabledPlugins] = useMemo(() => [
        pluginManager.filter(p => p.enabled).length,
        pluginManager.filter(p => !p.enabled).length
    ], [pluginManager]);
    /**处理开关 */
    const handleChange = async (iPlugin: PluginManager) => {
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    enabled: !iPlugin.enabled,
                    switchTime: new Date().getTime(),
                    //@ts-ignore
                    haveSettingTab: !p.haveSettingTab ? app.setting.pluginTabs.some((a) => a.id === iPlugin.id) : true,
                };

            }
            return p;
        });

        updatedPlugins.forEach(async p => {
            if (p.id === iPlugin.id) {
                if (iPlugin.enabled) {
                    await disablePlugin(iPlugin.id);
                } else if (p.delayStart > 0) {
                    //@ts-ignore
                    await app.plugins.enablePlugin(iPlugin.id);
                } else if (p.delayStart <= 0) {
                    await enablePlugin(iPlugin.id);

                }
            }
        });

        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        dispatch(updatePluginManager(updatedPlugins));
        await plugin.saveData(newSettings);
    }
    /**处理延时启动*/
    const handleDelayStartChange = async (iPlugin: PluginManager, newDelayStart: number) => {
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
                await disablePlugin(iPlugin.id);
                //@ts-ignore
                await app.plugins.enablePlugin(iPlugin.id);
            }
        } else {
            if (iPlugin.enabled)
                //通知ob启动插件，并保存插件信息
                enablePlugin(iPlugin.id);
        }
        const newSettings = { ...storeSettings, pluginManager: updatedPlugins };
        await plugin.saveData(newSettings);
        dispatch(updatePluginManager(upStoreDatedPlugins));
    }
    // 处理备注
    const handleCommentChange = async (iPlugin: PluginManager, newComment: string) => {
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
    // 打开插件设置
    const handleSettingClick = async (Iplugin: PluginManager) => {
        openPluginSettings(Iplugin);
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === Iplugin.id) {
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
            return [...filteredPlugins].sort((a, b) => {
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
        : filteredPlugins;

    return (
        <div className="PluginManagerView">
            <GroupView plugin={plugin} />
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
                        <th onClick={() => handleHeaderClick('tags')} >
                            标签{" "}
                            {storeField === "tags" && storeOrder === "asc" && "↑"}
                            {storeField === "tags" && storeOrder === "desc" && "↓"}
                        </th>
                        <th onClick={() => handleHeaderClick('comment')} >
                            备注{" "}
                            {storeField === "comment" && storeOrder === "asc" && "↑"}
                            {storeField === "comment" && storeOrder === "desc" && "↓"}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPlugins.map((Iplugin) => (
                        <tr key={Iplugin.id}>
                            <td className={Iplugin.enabled ? "enabled" : ""} onClick={() => { handleSettingClick(Iplugin) }}>

                                <div className="plugin-name">
                                    <div>{Iplugin.name}</div>
                                    {/* @ts-ignore */}
                                    <div className="plugin-setting">{plugin.enabled && plugin.haveSettingTab ? "  ⚙️" : "   "}<div className="version">{plugin.version}</div></div>
                                </div>
                            </td>
                            <td>{Iplugin.id != "watchtower" ? <Switch
                                label=""
                                description=""
                                value={Iplugin.enabled}
                                onChange={() => { handleChange(Iplugin) }}
                            /> : "⚪"}
                            </td>
                            <td>
                                {Iplugin.id != "watchtower" ?
                                    <input
                                        type="number"
                                        defaultValue={Iplugin.delayStart || ""}
                                        min="0"
                                        max="999"
                                        placeholder="0"
                                        onBlur={(e) => handleDelayStartChange(Iplugin, parseInt(e.target.value))}
                                    /> : "0"}
                            </td>
                            <td>
                                {getSwitchTimeByPluginId(Iplugin.id) === 0
                                    ? 0
                                    : new Date(getSwitchTimeByPluginId(Iplugin.id)).toLocaleString()}
                            </td>
                            <td>
                                {/* 标签组件 */}
                                <MakeTagsView Iplugin={Iplugin} plugin={plugin} />
                            </td>
                            <td>
                                <textarea
                                    value={Iplugin.comment}
                                    placeholder={Iplugin.description}
                                    rows={2}
                                    onChange={(e) => handleCommentChange(Iplugin, e.target.value)}
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