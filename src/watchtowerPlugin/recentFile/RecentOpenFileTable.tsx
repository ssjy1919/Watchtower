import * as React from "react";
import { Menu, Notice } from "obsidian";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import WatchtowerPlugin from "src/main";
import "./RecentOpenFileTable.css"
import { useMemo } from "react";

interface RecentOpenFileTableProps {
    plugin: WatchtowerPlugin,
}
export const RecentOpenFileTable: React.FC<RecentOpenFileTableProps> = ({ plugin }) => {
    const [className, setClassName] = React.useState('');
    const recentFilesOpenMode = useSelector((state: RootState) => state.settings.recentFilesOpenMode);

    const fileStats = useSelector((state: RootState) => state.settings.fileStats);

    const sortedFileStats = useMemo(() => {
        return fileStats.filter(
            (fileStat) => fileStat.differents !== "未找到" && fileStat.differents !== "已删除"
        ).sort((a, b) => b.recentOpen - a.recentOpen);
    }, [fileStats]);
    const handleClick = (index: number) => {
        setClassName((prevClassName) =>
            prevClassName === 'is-active' ? '' : 'is-active'
        );
        if (sortedFileStats[index].differents != "未找到" && sortedFileStats[index].differents != "已删除") {
            plugin.app.workspace.openLinkText(sortedFileStats[index].path, "", recentFilesOpenMode);
        } else {
            new Notice(`文件不存在：${sortedFileStats[index].path}`)
        }
    };
    // 右键菜单处理函数
    const handleContextMenu = (event: React.MouseEvent, index: number) => {
        event.preventDefault(); // 阻止默认右键行为

        const fileStat = sortedFileStats[index];

        // 创建右键菜单
        const menu = new Menu();

        // 添加菜单项：打开文件
        menu.addItem((item) => {
            item.setTitle("在当前标签页打开")
                .setIcon("document")
                .onClick(() => {
                    plugin.app.workspace.openLinkText(fileStat.path, "", false);
                });
        });

        // 添加菜单项：新标签页打开文件
        menu.addItem((item) => {
            item.setTitle("在新标签页中打开")
                .setIcon("lucide-file-plus")
                .onClick(() => {
                    plugin.app.workspace.openLinkText(fileStat.path, "", true);
                });
        });

        // 添加菜单项：复制文件路径
        menu.addItem((item) => {
            item.setTitle("复制路径")
                .setIcon("clipboard-copy")
                .onClick(() => {
                    navigator.clipboard.writeText(fileStat.path);
                });
        });



        // 显示菜单
        menu.showAtMouseEvent(event.nativeEvent);
    };

    return (
        <div className="recent-open-file-table">
            {sortedFileStats.map((fileStat, index) => (
                <div
                    key={index}
                    className="nav-file"
                    onClick={() => handleClick(index)}
                    onContextMenu={(event) => handleContextMenu(event, index)}
                >
                    <div className={`tree-item-self nav-file-title tappable is-clickable${className}`}>
                        <div className="tree-item-inner nav-file-title-content">{fileStat.name}</div>
                    </div>
                </div>
                // 限制历史文件的数量
            )).slice(0, 100)}
        </div>
    );
};