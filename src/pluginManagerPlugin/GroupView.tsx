import WatchtowerPlugin from "src/main";
import "./GroupView.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setSettings, updatePluginGroups } from "src/store";

interface GroupView {
    plugin: WatchtowerPlugin;
}

const GroupView: React.FC<GroupView> = ({ plugin }) => {
    // 定义输入框的显示状态
    const [isInputVisible, setInputVisible] = useState(false);
    const [pluginGroup, setPluginGroup] = useState("");
    const storeSettings = useSelector((state: RootState) => state.settings);
    const storePluginGroups = useSelector((state: RootState) => state.settings.pluginGroups);
    const dispatch = useDispatch();

    // 切换输入框显示状态的函数
    const handleAddItemClik = () => {
        if (pluginGroup && !storePluginGroups.includes(pluginGroup)) {
            dispatch(updatePluginGroups([...storePluginGroups, pluginGroup]));
            const newSettings = {
                ...storeSettings,
                pluginGroups: [...storePluginGroups, pluginGroup],
            };
            plugin.saveData(newSettings);
        }
        setPluginGroup("");
        setInputVisible(!isInputVisible);
    };
    const handleCancelClik = () => {
        setPluginGroup("");
        setInputVisible(!isInputVisible);
    };
    const handleDelayStartChange = (value: string) => {
        if (value.trim()) {
            setPluginGroup(value.trim());
        }
    };

    const handleDeleteItemClick = (group: string) => {
        const updatedGroups = storePluginGroups.filter((item) => item !== group);
        const newSettings = {
            ...storeSettings,
            pluginGroups: updatedGroups,
            pluginManager: storeSettings.pluginManager.map((plugin) => ({
                ...plugin,
                tags: plugin.tags.filter((tag) => tag !== group),
            })),
        };
        plugin.saveData(newSettings);
        dispatch(setSettings(newSettings));
    };

    /** 分组按钮 */
    const handleShowGroupClick = (group: string) => {
        const newSettings = {
            ...storeSettings,
            showPluginGroups: group,
        };
        dispatch(setSettings(newSettings));
        plugin.saveData(newSettings);
    };
    return (
        <div className="GroupView">
            {/* 全部分组按钮 */}
            <div
                className={`GroupView-title GroupView-group ${storeSettings.showPluginGroups === "" ? "GroupView-active" : ""
                    }`}
                onClick={() => handleShowGroupClick("")}
            >
                全部
            </div>
            {/* 动态生成分组按钮 */}
            {storePluginGroups.map((group, index) => (
                <div
                    key={index}
                    className={`GroupView-group ${storeSettings.showPluginGroups === group ? "GroupView-active" : ""
                        }`}
                    onClick={() => handleShowGroupClick(group)}
                >
                    {group}
                    {/* 删除按钮 */}
                    {isInputVisible && (
                        <span
                            className="GroupView-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItemClick(group);
                            }}
                        >
                            🗑️
                        </span>
                    )}
                </div>
            ))}
            <div className="GroupView-container">
                {/* 根据状态决定是否显示输入框 */}
                {isInputVisible && (
                    <input
                        type="text"
                        placeholder="分组名字"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleDelayStartChange(e.currentTarget.value.trim());
                            }
                        }}
                        onBlur={(e) => handleDelayStartChange(e.target.value.trim())}
                    />
                )}
            </div>
            <div className="GroupView-setting">
                {/* 加号按钮，点击切换输入框显示状态 */}
                <button onClick={handleAddItemClik}>
                    {isInputVisible ? "添加" : `➕`}
                </button>
                {/* 取消按钮 */}
                <button onClick={handleCancelClik} style={{ display: isInputVisible ? "inline-flex" : "none" }}>
                    {isInputVisible ? "取消" : ``}
                </button>
            </div>
        </div>
    );
};

export default GroupView;