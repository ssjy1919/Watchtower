import WatchtowerPlugin from "src/main";
import { Switch } from "src/setting/components/Switch";
import "./PluginManagerView.css"
import { useDispatch } from "react-redux";
import { RootState, setSettings, updatePluginManager } from "src/store";
import { useSelector } from "react-redux";
import { PluginManager } from "src/types";
import { disablePlugin, enablePlugin, getAllPlugins, getSwitchTimeByPluginId, openPluginSettings } from "./PMtools";
import { useMemo } from "react";
import GroupView from "./GroupView";
import MakeTagsView from "./MakeTagsView";
import { Notice } from "obsidian";


interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const storeSettings = useSelector((state: RootState) => state.settings);
    const pluginManager = useSelector((state: RootState) => state.settings.pluginManager);
    const storeField = useSelector((state: RootState) => state.settings.sortField.field);
    const storeOrder = useSelector((state: RootState) => state.settings.sortField.order);
    const showPluginInitial = useSelector((state: RootState) => state.settings.showPluginInitial);
    const dispatch = useDispatch();
    // 根据 showPluginGroups 过滤插件列表
    const filteredPlugins = pluginManager.filter(Iplugin => {
        // 如果 showPluginGroups 为空，则显示所有插件
        if (!storeSettings.showPluginGroups) return true;
        // 否则仅显示 tags 包含 showPluginGroups 的插件
        return Iplugin.tags.includes(storeSettings.showPluginGroups);
    });

    // 计算属用 useMemo 
    const [getEnabledPlugins, getDisabledPlugins] = useMemo(() => [
        pluginManager.filter(p => p.enabled).length,
        pluginManager.filter(p => !p.enabled).length
    ], [pluginManager]);
    /**处理开关 */
    const handleChange = async (iPlugin: PluginManager) => {

        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                //@ts-ignore
                if (plugin.app.isMobile && iPlugin.isDesktopOnly) {
                    new Notice("该插件不支持移动端使用");
                    return p;
                }
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
                //@ts-ignore
                if (plugin.app.isMobile && iPlugin.isDesktopOnly) {
                    return;
                }
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
        await plugin.saveData(newSettings);
        dispatch(updatePluginManager(updatedPlugins));
        getAllPlugins();
    }
    /**处理延时启动*/
    const handleDelayStartChange = async (iPlugin: PluginManager, newDelayStart: number) => {
        if (iPlugin.delayStart === newDelayStart || (!iPlugin.delayStart && !newDelayStart)) return;
        //记录到设置的启动状态，下次重启obsidian使用这个配置显示
        const updatedPlugins = pluginManager.map(p => {
            if (p.id === iPlugin.id) {
                return {
                    ...p,
                    delayStart: newDelayStart || 0,
                    switchTime: new Date().getTime(),
                    enabled: newDelayStart ? false : true,
                };
            }
            else {
                return {
                    ...p,
                    // 其他插件检查一遍延时启动，避免写入配置时被真实插件状态覆盖
                    enabled: p.delayStart ? false : true,
                };
            }
        });
        //配置给store用于当前启动状态的显示，用户只更改延迟时间，开关不应该是关闭
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
        dispatch(updatePluginManager(upStoreDatedPlugins));
        await plugin.saveData(newSettings);
        getAllPlugins();
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
        getAllPlugins();
    }
    // 打开插件设置
    const handleSettingClick = async (Iplugin: PluginManager) => {

        openPluginSettings(Iplugin, plugin);
        if (!Iplugin.enabled) return;
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
        getAllPlugins();
    }
    // 处理下拉菜单排序选择（保留，用于内部调用）
    const handleSortChange = async (field: keyof PluginManager, order: "asc" | "desc") => {
        const newSortField = { field, order };

        const updatedSettings = { ...storeSettings, sortField: newSortField };
        // 更新插件配置和 Redux 状态
        plugin.settings = updatedSettings;
        dispatch(setSettings(updatedSettings));
        await plugin.saveData(updatedSettings);
        getAllPlugins();
    };

    // 循环切换排序状态
    const handleHeaderClick = (field: keyof PluginManager) => {
        let newOrder: "asc" | "desc" | "" = "";
        if (storeField !== field) {
            newOrder = "asc";
        } else {
            newOrder = storeOrder === "asc" ? "desc" : "asc";

        }
        handleSortChange(field, newOrder);
    };

    // 根据排序状态返回排序后的列表
    const sortedPlugins = (storeField && storeOrder)
        ? [...filteredPlugins].sort((a, b) => {
            const sortField = storeField;
            let aVal = a[sortField] ?? "";
            let bVal = b[sortField] ?? "";

            // 特殊处理布尔值
            if (sortField === "enabled") {
                aVal = a.enabled ? 1 : 0;
                bVal = b.enabled ? 1 : 0;
            }

            // 主排序
            if (aVal > bVal) return storeOrder === "asc" ? 1 : -1;
            if (aVal < bVal) return storeOrder === "asc" ? -1 : 1;

            // 次排序（按名称）
            return a.name.localeCompare(b.name);
        })
        : filteredPlugins;

    // 先提取并去重首字母
    // 修改后的排序比较函数
    const uniqueLetters = Array.from(new Set(
        sortedPlugins
            .map(p => p.name.at(0))
    ))
        .filter(Boolean)
        .sort((a, b) => {
            // 强制转换为字符串并设置默认值
            const strA = String(a || '');
            const strB = String(b || '');
            const isAUpper = /[A-Z]/.test(strA);
            const isBUpper = /[A-Z]/.test(strB);
            if (isAUpper && !isBUpper) return 1;
            if (!isAUpper && isBUpper) return -1;
            // 使用转换后的字符串进行比较
            if (strA < strB) return -1;
            if (strA > strB) return 1;
            return 0;
        });
    // 左侧字母分组按钮
    const handleLetterClick = async (initial: string | undefined) => {
        if (initial) {
            const newSettings = { ...storeSettings, showPluginInitial: initial };
            dispatch(setSettings(newSettings));
            await plugin.saveData(newSettings);
            getAllPlugins();
        }
    }
    const saveConfig = async () => {
        const newSettings = { ...storeSettings, secondPluginManager: storeSettings.pluginManager };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
        getAllPlugins();
        new Notice('插件配置保存成功');
    }
    const restoreConfig = () => {
        storeSettings.secondPluginManager.forEach(async (p) => {
            //@ts-ignore
            if (plugin.app.isMobile && p.isDesktopOnly) {
                return;
            }
            if (p.delayStart > 0) {
                //@ts-ignore
                p.enabled ? await plugin.app.plugins.enablePlugin(p.id) : await plugin.app.plugins.disablePlugin(p.id);
            } else {
                //通知ob启动插件，并保存插件信息
                p.enabled ? enablePlugin(p.id) : disablePlugin(p.id);
            }
            const newSettings = { ...storeSettings, pluginManager: storeSettings.secondPluginManager };
            dispatch(setSettings(newSettings));
            await plugin.saveData(newSettings);
            getAllPlugins();
        });
        new Notice('按配置恢复插件状态');
    };
    return (
        <div className="PluginManagerView">
            <div className="grouping">
                <div className="tag-container">
                    <span className={`initial-tag ${showPluginInitial === "#" ? "active-initial" : ""}`} onClick={() => handleLetterClick("#")}>✲</span>
                    {/* // 使用去重后的数组渲染 */}
                    {uniqueLetters.map((initial, index) => (
                        <span
                            key={index}
                            className={`initial-tag ${showPluginInitial === initial ? "active-initial" : ""}`}
                            onClick={() => handleLetterClick(initial)}
                        >
                            {initial}
                        </span>
                    ))}
                </div>
            </div>
            <div className="pluginManager-table">
                <div className="pluginManager-table-header">
                    <GroupView plugin={plugin} />
                    <div>
                        <button title="按记录的配置恢复插件状态" onClick={() => restoreConfig()}>恢复</button>
                        <button title="保存当前插件状态的配置" onClick={() => saveConfig()}>保存</button>
                    </div>
                </div>
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
                            <th onClick={() => handleHeaderClick('tags')} >
                                标签{" "}
                                {storeField === "tags" && storeOrder === "asc" && "↑"}
                                {storeField === "tags" && storeOrder === "desc" && "↓"}
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
                        {sortedPlugins.filter(Iplugin => showPluginInitial == "#" || showPluginInitial == Iplugin.name.at(0))
                            .map((Iplugin) => (
                                <tr key={Iplugin.id}>
                                    <td className={Iplugin.enabled ? "enabled" : ""} onClick={() => { handleSettingClick(Iplugin) }}>
                                        {/* @ts-ignore */}
                                        <div className={`plugin-name ${plugin.app.isMobile && Iplugin.isDesktopOnly ? "isDesktopOnly" : ""}`}>
                                            <div>{Iplugin.name}</div>

                                            <div className="plugin-setting">{Iplugin.enabled && Iplugin.haveSettingTab ? "  ⚙️" : "   "}<div className="version">{Iplugin.version}</div></div>
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
                                        {/* 标签组件 */}
                                        <MakeTagsView Iplugin={Iplugin} plugin={plugin} />
                                    </td>
                                    <td>
                                        {getSwitchTimeByPluginId(Iplugin.id) === 0
                                            ? 0
                                            : new Date(getSwitchTimeByPluginId(Iplugin.id)).toLocaleString()}
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
        </div>
    );
};

export default PluginManagerView;