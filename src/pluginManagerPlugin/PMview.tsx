import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setFileChange } from "src/store";
import WatchtowerPlugin from "src/main";
import { PluginHandler } from "./PMhandler";
import { IPlugin } from "./PMhandler";
import { Switch } from "src/setting/components/Switch";

interface PluginManagerView {
    plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
    const fileChange = useSelector((state: RootState) => state.counter.fileChange);
    const differentFiles = useSelector((state: RootState) => state.counter.differentFiles);
    const stoerSettings = useSelector((state: RootState) => state.settings);
    const settings = useSelector((state: RootState) => state.settings);
    const [className, setClassName] = useState('file-supervision-table-none');
    const [plugins, setPlugins] = useState<IPlugin[]>([]);
    const dispatch = useDispatch();

    const pluginHandler = useMemo(() => new PluginHandler(plugin), [plugin]);
    useEffect(() => {
        const allPlugins = pluginHandler.getAllPlugins();
        const enabledPlugins = pluginHandler.getEnabledPlugins();
        const disabledPlugins = pluginHandler.getDisabledPlugins();
        setPlugins([...enabledPlugins, ...disabledPlugins]);

    }, [pluginHandler]);

        const handleChange = async (iPlugin: IPlugin) => {
            if (iPlugin.enabled) {
                pluginHandler.enablePlugin(iPlugin.id);
            }else{
                pluginHandler.disablePlugin(iPlugin.id);
            }
        };
    return (
        <div className="PluginManagerView">
            <table>
                <thead>
                    <tr>
                        <th>插件名称</th>
                        <th>状态</th>
                        <th>操作时间</th>
                    </tr>
                </thead>
                <tbody>
                    {plugins.map((plugin) => (
                        <tr key={plugin.id}>
                            <td>{plugin.name}</td>
                            <td>
                                <Switch
                                    label=""
                                    description=""
                                    value={plugin.enabled}
                                    onChange={() => { handleChange(plugin)}}
                                />
                            </td>
                            <td>{pluginHandler.getSwitchTimeByPluginId(plugin.id)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PluginManagerView;