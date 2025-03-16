import { App, PluginSettingTab } from 'obsidian';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import "./settingTab.css";
import { Switch } from './components/Switch';
import * as React from 'react';
import { init } from '../toolsFC';
interface SettingComponentProps {
    plugin: WatchtowerPlugin;
}
const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
    const [isSwitchOn, setIsSwitchOn] = React.useState(plugin.settings.watchtowerPlugin);

    const handleChange = async (value: boolean) => {
        setIsSwitchOn(value);
        
        plugin.settings.watchtowerPlugin = value;
        await plugin.saveData(plugin.settings);
        if (value) {
            await init(plugin);
        }
    };

    return (
        <>
            <div className="file-Supervision">
                <Switch
                    label="文件监控功能"
                    description="启用或禁用文件监控功能（重启obsidian生效）"
                    value={isSwitchOn}
                    onChange={handleChange}
                />
            </div>
            <div className="file-Supervision">
                <Switch
                    label="文件监控功能"
                    description="启用或禁用文件监控功能（重启obsidian生效）"
                    value={isSwitchOn}
                    onChange={handleChange}
                />
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
                <SettingComponent plugin={this.plugin} />
            </React.StrictMode>
        );
    }
}