import WatchtowerPlugin from "src/main";
import { Switch } from "src/setting/components/Switch";
import "./PluginManagerView.css"
import { useDispatch } from "react-redux";
import { RootState, updataSettings, updataPluginManager } from "src/store";
import { useSelector } from "react-redux";
import { PluginManager } from "src/types";
import { disablePlugin, enablePlugin, getAllPlugins, getSwitchTimeByPluginId, openPluginSettings } from "./PMtools";
import { useMemo, useState } from "react";
import GroupView from "./GroupView";
import MakeTagsView from "./MakeTagsView";
import { Notice } from "obsidian";
import PluginCommentCell from "./PluginCommentCell";

interface PluginManagerView {
	plugin: WatchtowerPlugin;
}

const PluginManagerView: React.FC<PluginManagerView> = ({ plugin }) => {
	const storeSettings = useSelector((state: RootState) => state.settings);
	const pluginManager = useSelector((state: RootState) => state.settings.pluginManager);
	const storeField = useSelector((state: RootState) => state.settings.sortField.field);
	const storeOrder = useSelector((state: RootState) => state.settings.sortField.order);
	const showPluginInitial = useSelector((state: RootState) => state.settings.showPluginInitial);
	const [pluginNote, setPluginNote] = useState<{ [id: string]: boolean }>({});
	const dispatch = useDispatch();
	const [searchQuery, setSearchQuery] = useState<string>("");

	// 根据 showPluginGroups 过滤插件列表
	const filteredPlugins = pluginManager.filter(Iplugin => {
		// 分组过滤（原逻辑）
		const matchesGroup = !storeSettings.showPluginGroups
			|| Iplugin.tags.includes(storeSettings.showPluginGroups);

		// 搜索过滤（新逻辑：优先匹配 comment，若为空则匹配 description）
		const searchLower = searchQuery.trim().toLowerCase();
		const matchesSearch = !searchQuery
			|| Iplugin.name.toLowerCase().includes(searchLower)
			|| (Iplugin.comment.toLowerCase() || Iplugin.description.toLowerCase()).includes(searchLower);

		return matchesGroup && matchesSearch;
	});

	const [getEnabledPlugins, getDisabledPlugins] = useMemo(() => [
		pluginManager.filter(p => p.enabled).length,
		pluginManager.filter(p => !p.enabled).length
	], [pluginManager]);
	/**处理开关 */
	const handleChange = async (iPlugin: PluginManager) => {

		const updatadPlugins = pluginManager.map(p => {
			if (p.id === iPlugin.id) {
				//@ts-ignore
				if (plugin.app.isMobile && iPlugin.isDesktopOnly) {
					new Notice("该插件不支持移动端使用");
					return p;
				}
				return {
					...p,
					enabled: !iPlugin.enabled,
					switchTime: new Date().getTime(),
				};

			}
			return p;
		});
		updatadPlugins.forEach(async p => {
			if (p.id === iPlugin.id) {
				//@ts-ignore
				if (plugin.app.isMobile && iPlugin.isDesktopOnly) {
					return;
				}
				if (iPlugin.enabled) {
					await disablePlugin(iPlugin.id);
				} else if (p.delayStart > 0) {
					//@ts-ignore
					await app.plugins.enablePlugin(iPlugin.id);
				} else if (p.delayStart <= 0) {
					await enablePlugin(iPlugin.id);

				}
			}
		});
		const newSettings = { ...storeSettings, pluginManager: updatadPlugins };
		await plugin.saveData(newSettings);
		dispatch(updataPluginManager(updatadPlugins));
		getAllPlugins();
	}
	/**处理延时启动*/
	const handleDelayStartChange = async (iPlugin: PluginManager, newDelayStart: number) => {
		if (iPlugin.delayStart === newDelayStart || newDelayStart < 0) return;
		const updatadPlugins = pluginManager.map(p => {
			if (p.id === iPlugin.id) {
				return {
					...p,
					delayStart: newDelayStart,
					switchTime: new Date().getTime(),
				};
			}
			return p
		});
		if (iPlugin.enabled)
			if (newDelayStart > 0) {
				//用户设置的延时时间大于0且插件处于启用状态时，通知ob禁用插件后再用disablePlugin临时启动
				await disablePlugin(iPlugin.id);
				//@ts-ignore
				await app.plugins.enablePlugin(iPlugin.id);
			} else if (newDelayStart === 0) {
				//通知ob启动插件，并保存插件信息
				await enablePlugin(iPlugin.id);
			}
		const newSettings = { ...storeSettings, pluginManager: updatadPlugins };
		dispatch(updataPluginManager(updatadPlugins));
		await plugin.saveData(newSettings);
		getAllPlugins();
	}
	// 处理备注
	const handleCommentChange = async (iPlugin: PluginManager, newComment: string) => {
		const updatadPlugins = pluginManager.map(p => {
			if (p.id === iPlugin.id) {
				return {
					...p,
					comment: newComment,
					switchTime: new Date().getTime(),
				};
			}
			return p;
		});
		const newSettings = { ...storeSettings, pluginManager: updatadPlugins };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
		getAllPlugins();
	}
	// 打开插件设置
	const handleSettingClick = async (Iplugin: PluginManager) => {

		openPluginSettings(Iplugin, plugin);
		if (!Iplugin.enabled) return;
		const updatadPlugins = pluginManager.map(p => {
			if (p.id === Iplugin.id) {
				return {
					...p,
					switchTime: new Date().getTime(),
				};
			}
			return p;
		});
		const newSettings = { ...storeSettings, pluginManager: updatadPlugins };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
		getAllPlugins();
	}
	// 处理下拉菜单排序选择（保留，用于内部调用）
	const handleSortChange = async (field: keyof PluginManager, order: "asc" | "desc") => {
		const newSortField = { field, order };

		const updatadSettings = { ...storeSettings, sortField: newSortField };
		// 更新插件配置和 Redux 状态
		plugin.settings = updatadSettings;
		dispatch(updataSettings(updatadSettings));
		await plugin.saveData(updatadSettings);
		getAllPlugins();
	};

	// 循环切换排序状态
	const handleHeaderClick = (field: keyof PluginManager) => {
		let newOrder: "asc" | "desc" | "" = "";
		if (storeField !== field) {
			newOrder = "asc";
		} else {
			newOrder = storeOrder === "asc" ? "desc" : "asc";

		}
		handleSortChange(field, newOrder);
	};

	// 根据排序状态返回排序后的列表
	const sortedPlugins = (storeField && storeOrder)
		? [...filteredPlugins].sort((a, b) => {
			const sortField = storeField;
			let aVal = a[sortField] ?? "";
			let bVal = b[sortField] ?? "";

			// 特殊处理布尔值
			if (sortField === "enabled") {
				aVal = a.enabled ? 1 : 0;
				bVal = b.enabled ? 1 : 0;
			}

			// 主排序
			if (aVal > bVal) return storeOrder === "asc" ? 1 : -1;
			if (aVal < bVal) return storeOrder === "asc" ? -1 : 1;

			// 次排序（按名称）
			return a.name.localeCompare(b.name);
		})
		: filteredPlugins;

	// 先提取并去重首字母
	// 修改后的排序比较函数
	const uniqueLetters = Array.from(new Set(
		sortedPlugins
			.map(p => p.name.at(0))
	))
		.filter(Boolean)
		.sort((a, b) => {
			// 强制转换为字符串并设置默认值
			const strA = String(a || '');
			const strB = String(b || '');
			const isAUpper = /[A-Z]/.test(strA);
			const isBUpper = /[A-Z]/.test(strB);
			if (isAUpper && !isBUpper) return 1;
			if (!isAUpper && isBUpper) return -1;
			// 使用转换后的字符串进行比较
			if (strA < strB) return -1;
			if (strA > strB) return 1;
			return 0;
		});
	// 左侧字母分组按钮
	const handleLetterClick = async (initial: string | undefined) => {
		if (initial) {
			const newSettings = { ...storeSettings, showPluginInitial: initial };
			dispatch(updataSettings(newSettings));
			await plugin.saveData(newSettings);
			getAllPlugins();
		}
	}
	const saveConfig = async () => {
		const newSettings = { ...storeSettings, secondPluginManager: storeSettings.pluginManager };
		dispatch(updataSettings(newSettings));
		await plugin.saveData(newSettings);
		getAllPlugins();
		new Notice('插件配置保存成功', 3000);
	}
	const restoreConfig = async () => {
		try {

			new Notice('插件状态恢复中...', 2000);
			// 使用 Promise.all 并行处理插件恢复
			const promises = storeSettings.secondPluginManager.map(async (p) => {
				//@ts-ignore
				if (plugin.app.isMobile && p.isDesktopOnly) return;
				if (p.delayStart > 0) {
					p.enabled
						//@ts-ignore
						? await plugin.app.plugins.enablePlugin(p.id)
						//@ts-ignore
						: await plugin.app.plugins.disablePlugin(p.id);
				} else {
					p.enabled ? await enablePlugin(p.id) : await disablePlugin(p.id);
				}
			});
			await Promise.all(promises);

			// 统一更新状态（避免多次 dispatch 和 saveData）
			const newSettings = { ...storeSettings, pluginManager: storeSettings.secondPluginManager };
			dispatch(updataSettings(newSettings));
			await plugin.saveData(newSettings);
			getAllPlugins();
			new Notice('插件状态恢复完成', 5000);
		} catch (error) {
			console.error('恢复插件配置失败:', error);
			new Notice('恢复插件配置失败', 5000);
		}
	};
	return (
		<div className="PluginManagerView">
			<div className="grouping">
				<div className="tag-container">
					<span className={`initial-tag ${showPluginInitial === "#" ? "active-initial" : ""}`} onClick={() => handleLetterClick("#")}>✲</span>
					{/* // 使用去重后的数组渲染 */}
					{uniqueLetters.map((initial, index) => (
						<span
							key={index}
							className={`initial-tag ${showPluginInitial === initial ? "active-initial" : ""}`}
							onClick={() => handleLetterClick(initial)}
						>
							{initial}
						</span>
					))}
				</div>
			</div>
			<div className="pluginManager-table">
				<div className="pluginManager-table-header">
					<GroupView plugin={plugin}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
					/>
					<div>
						<button title="恢复所有插件开关状态" onClick={() => restoreConfig()}>恢复</button>
						<button title="保存所有插件开关状态" onClick={() => saveConfig()}>保存</button>
					</div>
				</div>
				<table>
					<thead>
						<tr>
							<th onClick={() => handleHeaderClick('name')} >
								一共{pluginManager.length}个插件，开启{getEnabledPlugins}关闭{getDisabledPlugins}{" "}
								{storeField === "name" && storeOrder === "asc" && "↑"}
								{storeField === "name" && storeOrder === "desc" && "↓"}
							</th>
							<th onClick={() => handleHeaderClick('enabled')} >
								状态{" "}
								{storeField === "enabled" && storeOrder === "asc" && "↑"}
								{storeField === "enabled" && storeOrder === "desc" && "↓"}
							</th>
							<th onClick={() => handleHeaderClick('delayStart')} >
								延时启动(秒)
								{storeField === "delayStart" && storeOrder === "asc" && "↑"}
								{storeField === "delayStart" && storeOrder === "desc" && "↓"}
							</th>
							<th onClick={() => handleHeaderClick('tags')} >
								标签{" "}
								{storeField === "tags" && storeOrder === "asc" && "↑"}
								{storeField === "tags" && storeOrder === "desc" && "↓"}
							</th>
							<th onClick={() => handleHeaderClick('switchTime')} >
								更改时间{" "}
								{storeField === "switchTime" && storeOrder === "asc" && "↑"}
								{storeField === "switchTime" && storeOrder === "desc" && "↓"}
							</th>
							<th onClick={() => handleHeaderClick('comment')} >
								备注{" "}
								{storeField === "comment" && storeOrder === "asc" && "↑"}
								{storeField === "comment" && storeOrder === "desc" && "↓"}
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedPlugins
							.filter(Iplugin => showPluginInitial == "#" || showPluginInitial == Iplugin.name.at(0))
							.map((Iplugin) => {
								return (
									<tr key={Iplugin.id}>
										<td className={Iplugin.enabled ? "enabled" : "disable"} onClick={() => { handleSettingClick(Iplugin) }}>
											{/* @ts-ignore */}
											<div className={`plugin-name ${plugin.app.isMobile && Iplugin.isDesktopOnly ? "isDesktopOnly" : ""}`}>
												<div>{Iplugin.name}</div>
												{/* @ts-ignore */}
												<div className="plugin-setting">{Iplugin.enabled && plugin.app.setting.pluginTabs.find((P) => P.id === Iplugin.id) ? "  ⚙️" : "   "}<div className="version">{Iplugin.version}</div></div>
											</div>
										</td>
										<td>{Iplugin.id != "watchtower" ? <Switch
											label=""
											description=""
											value={Iplugin.enabled}
											onChange={() => { handleChange(Iplugin) }}
										/> : "⚪"}
										</td>
										<td>
											{Iplugin.id != "watchtower" ?
												<input
													type="number"
													min="0"
													max="999"
													placeholder="0"
													defaultValue={Iplugin.delayStart || ""}
													onBlur={(e) => {
														const value = parseInt(e.currentTarget.value);
														handleDelayStartChange(Iplugin, isNaN(value) ? 0 : value);
													}}
												/> : "0"}
										</td>
										<td>
											{/* 标签组件 */}
											<MakeTagsView Iplugin={Iplugin} plugin={plugin} />
										</td>
										<td>
											{getSwitchTimeByPluginId(Iplugin.id) === 0
												? 0
												: new Date(getSwitchTimeByPluginId(Iplugin.id)).toLocaleString()}
										</td>
										<td>
											<PluginCommentCell
												plugin={plugin}
												Iplugin={Iplugin}
												editing={!!pluginNote[Iplugin.id]}
												value={Iplugin.comment}
												placeholder={Iplugin.description}
												onChange={v => handleCommentChange(Iplugin, v)}
												onEdit={() => setPluginNote({ ...pluginNote, [Iplugin.id]: true })}
												onBlur={() => setPluginNote({ ...pluginNote, [Iplugin.id]: false })}
											/>
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>

			</div>
		</div>
	);
};

export default PluginManagerView;
