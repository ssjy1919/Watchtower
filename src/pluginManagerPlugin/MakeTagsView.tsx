import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import WatchtowerPlugin from "src/main";
import { RootState, setSettings, updatePluginManager } from "src/store";
import { PluginManager } from "src/types";
import "./MakeTagsView.css";

interface MakeTagsViewProps {
    Iplugin: PluginManager;
    plugin: WatchtowerPlugin;
}

const MakeTagsView: React.FC<MakeTagsViewProps> = ({ Iplugin, plugin }) => {
    // 定义下拉选单的显示状态
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [selectedTag, setSelectedTag] = useState("");

    // 从 Redux Store 中获取设置和插件分组标签
    const storeSettings = useSelector((state: RootState) => state.settings);
    const pluginGroups = useSelector((state: RootState) => state.settings.pluginGroups);
    const dispatch = useDispatch();

    // 当前插件的 tags
    const currentTags = Iplugin.tags || [];

    // 确定按钮 切换下拉选单显示状态的函数 
    const handleAddTagClick = async () => {
        if (selectedTag && !currentTags.includes(selectedTag)) {
            const updatedTags = [...currentTags, selectedTag];

            // 定义 updatedPlugin
            const updatedPlugin = {
                ...Iplugin,
                tags: updatedTags,
                switchTime: new Date().getTime(),
            };

            const newPluginManager = storeSettings.pluginManager.map((p) =>
                p.id === Iplugin.id ? updatedPlugin : p
            );
            dispatch(updatePluginManager(newPluginManager));
            const newSettings = {
                ...storeSettings,
                pluginManager: newPluginManager,
            };
            await plugin.saveData(newSettings); // 假设 PluginManager 也有 saveData 方法
        }
        setSelectedTag("");
        setDropdownVisible(false); // 添加标签后关闭下拉菜单
    };

    // 处理标签选择变化
    const handleTagChange = (value: string) => {
        setSelectedTag(value);
    };

    // 删除标签
    const handleDeleteTagClick = async (tag: string) => {
        const updatedTags = currentTags.filter((item) => item !== tag);

        // 定义 updatedPlugin
        const updatedPlugin = {
            ...Iplugin,
            tags: updatedTags,
            switchTime: new Date().getTime(),
        };

        const newPluginManager = storeSettings.pluginManager.map((p) =>
            p.id === Iplugin.id ? updatedPlugin : p
        );
        dispatch(updatePluginManager(newPluginManager));
        const newSettings = {
            ...storeSettings,
            pluginManager: storeSettings.pluginManager.map((p) =>
                p.id === Iplugin.id ? updatedPlugin : p
            ),
        };
        await plugin.saveData(newSettings);
    };

    // 显示标签
    const handleShowTagClick = async (tag: string) => {
        const newSettings = {
            ...storeSettings,
            showPluginGroups: tag,
        };
        dispatch(setSettings(newSettings));
        await plugin.saveData(newSettings);
    };

    return (
        <div className="MakeTagsView">
            {/* 标签列表 */}
            {currentTags.map((tag, index) => (
                <div key={index} className={`MakeTagsView-tag ${storeSettings.showPluginGroups === tag ? "GroupView-active" : ""
                    }`} onClick={() => handleShowTagClick(tag)}>
                    {tag}
                    {/* 删除按钮：仅在 isDropdownVisible 为 true 时显示 */}
                    {isDropdownVisible && (
                        <span
                            className="MakeTagsView-delete"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTagClick(tag);
                            }}
                        >
                            ×
                        </span>
                    )}
                </div>
            ))}
            {/* 下拉选单容器 */}
            <div className="MakeTagsView-container">
                {isDropdownVisible && (
                    <select
                        value={selectedTag}
                        onChange={(e) => handleTagChange(e.target.value)}
                        onBlur={(e) => handleTagChange(e.target.value)}
                    >
                        <option value="" disabled>
                            选择分组
                        </option>
                        {/* 过滤掉当前插件已有的标签 */}
                        {pluginGroups
                            .filter((option) => !currentTags.includes(option)) // 排除已有的标签
                            .map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                    </select>
                )}
                {/* 确认按钮 */}
                <div className="MakeTagsView-enter">
                    {isDropdownVisible && (
                        <>
                            <span onClick={handleAddTagClick}>确定</span>
                            <span onClick={() => setDropdownVisible(false)}>取消</span>
                        </>
                    )}
                </div>
            </div>

            {/* 加号/确认按钮 */}
            <div className="MakeTagsView-setting">
                {/* 加号按钮 */}
                {!isDropdownVisible && (
                    <span onClick={() => setDropdownVisible(true)}>+</span>
                )}

            </div>
        </div>
    );
};

export default MakeTagsView;