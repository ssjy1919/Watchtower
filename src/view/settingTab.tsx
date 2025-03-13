import { App, PluginSettingTab } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import { FileHandler } from '../fileHandler'; // 引入 FileHandler

interface SettingComponentProps {
  plugin: WatchtowerPlugin;
}

const SettingComponent: React.FC<SettingComponentProps> = ({ plugin }) => {
  const [markTime, setMarkTime] = React.useState(plugin.settings.markTime);

  const handleChange = async (value: string) => {
    setMarkTime(value);
    plugin.settings.markTime = value;

    // 创建 FileHandler 实例并调用 saveFileInfo
    const fileHandler = new FileHandler(plugin.app, plugin.settings, plugin);
    await fileHandler.saveFileInfo(); // 调用 saveFileInfo 方法
  };

  return (
    <div>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Setting #1</div>
          <div className="setting-item-description">It's a secret</div>
        </div>
        <div className="setting-item-control">
          <input
            type="text"
            placeholder="Enter your secret"
            value={markTime}
            onChange={(e) => handleChange(e.target.value)}
          />
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