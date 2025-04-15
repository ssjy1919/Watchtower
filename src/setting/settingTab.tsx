import { App, PluginSettingTab } from 'obsidian';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import "./settingTab.css";
import { Switch } from './components/Switch';
import * as React from 'react';
import { RootState, setSettings, store } from 'src/store';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { init } from 'src/watchtowerPlugin/toolsFC';
interface SettingComponentProps {
    plugin: WatchtowerPlugin;
}
const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
    const [isSwitchOn, setIsSwitchOn] = React.useState(plugin.settings.watchtowerPlugin);
    const storeSettings = useSelector((state: RootState) => state.settings);
    const recentFilesMode = useSelector((state: RootState) => state.settings.recentFilesOpenMode);
    const pluginManagerMode = useSelector((state: RootState) => state.settings.pluginManagerPlugin);
    const dispatch = useDispatch();
    const handleChangeFileSupervision = async (value: boolean) => {
        setIsSwitchOn(value);
        
        const newSettings = { ...storeSettings,watchtowerPlugin: value };
        await plugin.saveData(newSettings);
        if (value) {
            await init(plugin);
        }
    };




    const handleChange = async (value: boolean) => {
        const newSettings = { ...storeSettings,recentFilesOpenMode: value };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
    };
    const handlePluginManagerChange = async (value: boolean) => {
        const newSettings = { ...storeSettings,pluginManagerPlugin: value };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
    };

    return (
        <>
            <div className="file-Supervision-setting-container">
                <div className="link">
                    <a href="https://github.com/ssjy1919/Watchtower">前往Github项目地址</a>
                </div>
                <div className="file-Supervision">
                    <Switch
                        label="文件监控功能"
                        description="文件监控功能开关（开启时重启obsidian生效）"
                        value={isSwitchOn}
                        onChange={handleChangeFileSupervision}
                    />
                    {plugin.settings.watchtowerPlugin && <div className="recent-file-open-new-tab">
                        <Switch
                            label="最近文件在新标签页打开"
                            description="开启按钮时，打开历史文件在新页面打开。"
                            value={recentFilesMode}
                            onChange={handleChange}
                        />
                        
                    </div>}

                </div>
                <div className="plugin-manager">
                    <Switch
                        label="插件管理功能"
                        description="插件管理功能开关。（开启时重启obsidian生效）"
                        value={pluginManagerMode}
                        onChange={handlePluginManagerChange}
                    />
                </div>

            </div>
        </>
    );
};

export class WatchtowerSettingTab extends PluginSettingTab {
    plugin: WatchtowerPlugin;
    root: ReactDOM.Root | null = null;

    constructor(app: App, plugin: WatchtowerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        if (!this.root) {
            this.root = ReactDOM.createRoot(containerEl);
        }

        this.root.render(
            <React.StrictMode>
                <Provider store={store}>
                    <SettingComponent plugin={this.plugin} />
                </Provider>
            </React.StrictMode>
        );
    }
}