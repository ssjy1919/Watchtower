import { App, PluginSettingTab } from 'obsidian';
import * as ReactDOM from 'react-dom/client';
import WatchtowerPlugin from 'src/main';
import "./settingTab.css";
import { Switch } from './components/Switch';
import * as React from 'react';
import { RootState, updataSettings, store } from 'src/store';
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
	const pluginSettingNewWindow = useSelector((state: RootState) => state.settings.pluginSettingNewWindow);
	const statusBarIcon = useSelector((state: RootState) => state.settings.statusBarIcon);
	const dispatch = useDispatch();
	const handleChangeFileSupervision = async (value: boolean) => {
		setIsSwitchOn(value);
		const newSettings = { ...storeSettings, watchtowerPlugin: value };
		await plugin.saveData(newSettings);
		if (value) {
			init(plugin);
		}
	};
	/**最近文件在新标签页打开*/
	const handleRecentFilesModeChange = async (value: boolean) => {
		const newSettings = { ...storeSettings, recentFilesOpenMode: value };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
	};
	/**添加底部状态栏图标*/
	const handleStatusBarIconChange = async (value: boolean) => {
		const newSettings = { ...storeSettings, statusBarIcon: value };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
	};
	const handlePluginManagerChange = async (value: boolean) => {
		const newSettings = { ...storeSettings, pluginManagerPlugin: value };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
	};
	const handlePluginSettingNewWindowChange = async (value: boolean) => {
		const newSettings = { ...storeSettings, pluginSettingNewWindow: value };
		dispatch(updataSettings(newSettings));
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
						description="文件监控功能开关（重启obsidian生效）"
						value={isSwitchOn}
						onChange={handleChangeFileSupervision}
					/>
					{isSwitchOn && <div className="setting-item-2">
						<Switch
							label="最近文件在新标签页打开"
							description="开启按钮时，打开历史文件在新页面打开。"
							value={recentFilesMode}
							onChange={handleRecentFilesModeChange}
						/>

						<div className='setting-item'>
							<div className='setting-item-info'>
								<div className="setting-item-name">历史文件视图排除文件</div>
								<div className='setting-item-description'>输入历史文件视图需要排除文件后缀，每行一个</div>
							</div>
							<div className='setting-item-control'>
								{/* 写一个输入框 */}
								<textarea
									className="textarea"
									placeholder=".md"
									value={
										(plugin.settings.excludeFileSuffix ?? [])
											.filter(Boolean)
											.map(s => s.trim())
											.join('\n')
									} // 显示的时候用换行拼接
									onChange={(e) => {
										const newValue = e.target.value;
										const newSuffixArray = newValue.split('\n').map(s => s.trim()).filter(s => s); // 去除空行和前后空格
										plugin.settings.excludeFileSuffix = newSuffixArray; // 更新插件设置中的数组
										const newSettings = { ...storeSettings, excludeFileSuffix: newSuffixArray };
										dispatch(updataSettings(newSettings));
										plugin.saveData(newSettings);
									}}
								/>
							</div>
						</div>
					</div>

					}

				</div>
				<div className="plugin-manager">
					<Switch
						label="插件管理功能"
						description="插件管理功能开关。（开启时重启obsidian生效）"
						value={pluginManagerMode}
						onChange={handlePluginManagerChange}
					/>
					{pluginManagerMode && <div className="plugin-setting-new-window-switch setting-item-2">
						<Switch
							label="插件管理页面在新窗口打开"
							description="开启时，插件管理的页面在新窗口打开。(只有桌面端有效)"
							value={pluginSettingNewWindow}
							onChange={handlePluginSettingNewWindowChange}
						/>
					</div>}
				</div>
				<Switch
					label="添加底部状态栏图标"
					description="开启按钮时，添加在底部添加一个可交互的状态栏图标。当插件记录中的文件信息与当前文件信息一致时会显示 √ ，否则显示 🐾 。（重启obsidian生效）"
					value={statusBarIcon}
					onChange={handleStatusBarIconChange}
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
				<Provider store={store}>
					<SettingComponent plugin={this.plugin} />
				</Provider>
			</React.StrictMode>
		);
	}
}
