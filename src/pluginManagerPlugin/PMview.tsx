import WatchtowerPlugin from "src/main";
import { PluginHandler } from "./PMhandler";
import { IPlugin } from "./PMhandler";
import { Switch } from "src/setting/components/Switch";
import "./PMview.css"
import { useDispatch } from "react-redux";
import { RootState, setSettings } from "src/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";
interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const pluginHandler = new PluginHandler(plugin);
    const pluginManager = useSelector((state: RootState) => state.settings.pluginManager);
    const dispatch = useDispatch();
    useEffect(() => {
        const nallPlugins = pluginHandler.getAllPlugins();
        plugin.settings.pluginManager = nallPlugins;
        dispatch(setSettings(plugin.settings));
    }, []);

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
    return (
        <div className="PluginManagerView">
            <table>
                <thead>
                    <tr>
                        <th>插件名称</th>
                        <th>状态</th>
                        <th>开关时间</th>
                        {/* <th>标签</th> */}
                        <th>备注</th>
                    </tr>
                </thead>
                <tbody>
                    {pluginManager.map((plugin) => (
                        <tr key={plugin.id}>
                            {/* @ts-ignore */}
                            <td className={app.plugins.enabledPlugins.has(plugin.id) ? "enabled" : ""} onClick={() => { handleSettingClick(plugin) }}>{plugin.name}{app.plugins.enabledPlugins.has(plugin.id) ? "  ⚙️" : ""}</td>
                            <td>{plugin.id != "watchtowerPlugin" ? <Switch
                                label=""
                                description=""
                                value={plugin.enabled}
                                onChange={() => { handleChange(plugin) }}
                            /> : ""}
                            </td>
                            <td>{pluginHandler.getSwitchTimeByPluginId(plugin.id) === 0 ? 0 : new Date(pluginHandler.getSwitchTimeByPluginId(plugin.id)).toLocaleString()}</td>
                            <td>                                <textarea
                                defaultValue={plugin.comment === "" ? plugin.description : plugin.comment}
                                placeholder={plugin.description}
                                rows={2}
                                onBlur={(e) => handleCommentChange(plugin, e.target.value)}
                            /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PluginManagerView;