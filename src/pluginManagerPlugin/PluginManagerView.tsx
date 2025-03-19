import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setFileChange } from "src/store";
import { Notice } from "obsidian";
import WatchtowerPlugin from "src/main";
import { PluginHandler } from "./PluginHandler";
import { IPlugin } from "./PluginHandler";

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

    useEffect(() => {
        if (fileChange) {
            dispatch(setFileChange(false));
        }
    }, [fileChange, dispatch, differentFiles, settings]);

    const handleClick = () => {
        setClassName((prevClassName) =>
            prevClassName === 'file-supervision-table-none'
                ? 'file-supervision-table-show'
                : 'file-supervision-table-none'
        );
    };

    const HandleSaveFileInfo = async () => {
        try {
            console.log(stoerSettings.markTime);
            await plugin.fileHandler.saveFileInfo();
            new Notice("文件信息已保存！");
            setClassName('file-supervision-table-none');
        } catch (error) {
            console.error("保存文件信息失败：", error);
            new Notice("保存文件信息失败，请检查控制台日志。");
        }
    };

    const handleOpenLink = (path: string, differents: string) => {
        if (differents != "文件丢失") {
            plugin.app.workspace.openLinkText(path, '', false);
        } else {
            new Notice(`文件不存在：${path}`);
        }
    };

    return (
        <div className="PluginManagerView">
            <h1>标题</h1>
            <table>
                <thead>
                    <tr>
                        <th>插件名称</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    {plugins.map((plugin) => (
                        <tr key={plugin.id}>
                            <td>{plugin.name}</td>
                            <td>{plugin.enabled ? "已开启" : "已关闭"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PluginManagerView;