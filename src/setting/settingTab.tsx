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
import { Droplist } from './components/Droplist';
import { RecentFilesSaveMode } from 'src/types';
interface SettingComponentProps {
    plugin: WatchtowerPlugin;
}
const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
    const [isSwitchOn, setIsSwitchOn] = React.useState(plugin.settings.watchtowerPlugin);
    const recentFilesMode = useSelector((state: RootState) => state.settings.recentFilesMode);
    const pluginManagerMode = useSelector((state: RootState) => state.settings.pluginManagerPlugin);
    const dispatch = useDispatch();
    const handleChangeFileSupervision = async (value: boolean) => {
        setIsSwitchOn(value);

        plugin.settings.watchtowerPlugin = value;
        await plugin.saveData(plugin.settings);
        if (value) {
            await init(plugin);
        }
    };




    const handleChange = async (value: boolean) => {
        plugin.settings.recentFilesMode.recentFilesOpenMode = value;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
    };
    const handlePluginManagerChange = async (value: boolean) => {
        plugin.settings.pluginManagerPlugin = value;
        dispatch(setSettings(plugin.settings));
        await plugin.saveData(plugin.settings);
    };
    const handleSetSaveMode = async (newValue: RecentFilesSaveMode) => {
        // 直接修改了原有的 settings 对象，而 Redux 的比较机制可能未能检测到这种“浅层”变更，导致状态未更新。
        // 解决方案是使用不可变更新模式，创建新的 settings 对象。
        // plugin.settings.recentFilesMode.recentFilesSaveMode = newValue;
        const newSettings = {
            ...plugin.settings,
            recentFilesMode: {
                ...plugin.settings.recentFilesMode,
                recentFilesSaveMode: newValue
            }
        };
        plugin.settings = newSettings;
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
    };
    return (
        <>
            <div className="file-Supervision-setting-container">
                <div className="link">
                    <a href="https://github.com/ssjy1919/Watchtower/releases">前往 Github 看看更新了什么</a>
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
                            value={recentFilesMode.recentFilesOpenMode}
                            onChange={handleChange}
                        />
                        <Droplist
                            label="历史文件列表保存方式"
                            description="选择历史文件列表的保存方式，自动保存或手动保存。"
                            value={recentFilesMode.recentFilesSaveMode}
                            onChange={(newValue) => handleSetSaveMode(newValue)}
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