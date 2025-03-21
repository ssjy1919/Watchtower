import { App, PluginSettingTab } from 'obsidian';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import "./settingTab.css";
import { Switch } from './components/Switch';
import * as React from 'react';
import { RootState, setSettings, store } from 'src/store';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { init } from 'src/toolsFC';
interface SettingComponentProps {
    plugin: WatchtowerPlugin;
}
const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
    const [isSwitchOn, setIsSwitchOn] = React.useState(plugin.settings.watchtowerPlugin);

    const handleChangeFileSupervision = async (value: boolean) => {
        setIsSwitchOn(value);

        plugin.settings.watchtowerPlugin = value;
        await plugin.saveData(plugin.settings);
        if (value) {
            await init(plugin);
        }
    };

    const recentOpenFilesMode = useSelector((state: RootState) => state.settings.recentOpenFilesMode);
    const dispatch = useDispatch();


    const handleChange = async (value: boolean) => {
        plugin.settings.recentOpenFilesMode = value;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
    };

    return (
        <>
            <div className="file-Supervision-setting-container">
                <div className="file-Supervision">
                    <Switch
                        label="文件监控功能"
                        description="启用或禁用文件监控功能（重启obsidian生效）"
                        value={isSwitchOn}
                        onChange={handleChangeFileSupervision}
                    />
                    {plugin.settings.watchtowerPlugin && <div className="recent-file-open-new-tab">
                        <Switch
                            label="历史文件打开方式"
                            description="开启按钮时，打开历史文件在新页面打开。"
                            value={recentOpenFilesMode}
                            onChange={handleChange}
                        />
                    </div>}
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