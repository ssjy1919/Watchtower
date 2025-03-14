import { App, PluginSettingTab } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import { FileHandler } from '../fileHandler'; // 引入 FileHandler
import "./settingTab.css";

interface SettingComponentProps {
    plugin: WatchtowerPlugin;
}

const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
    // 使用 plugin.settings.isWatch 初始化开关状态
    const [isSwitchOn, setIsSwitchOn] = React.useState(!!plugin.settings.isWatch);

    const handleChange = async (value: boolean) => {

        setIsSwitchOn(value);
        plugin.settings.isWatch = value; // 更新 isWatch 的值
        const fileHandler = new FileHandler(plugin.app, plugin.settings, plugin);
        await fileHandler.saveFileInfo(); // 调用 saveFileInfo 方法保存设置
    };

    return (
        <div className='file-Supervision'>
            <div className="setting-item">
                <div className="setting-item-info">
                    <div className="setting-item-name">文件监控功能</div>
                    <div className="setting-item-description">启用或禁用文件监控功能</div>
                </div>
                <div className="setting-item-control">
                    {/* 开关按钮 */}
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isSwitchOn}
                            onChange={(e) => handleChange(e.target.checked)}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
        </div>
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