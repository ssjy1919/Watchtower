import * as React from "react";
import { Menu } from "obsidian"; // 引入 Obsidian 的 Menu API
import { useSelector } from "react-redux";
import { RootState, store, setFileStatList } from "../store";
import WatchtowerPlugin from "src/main";


interface RecentOpenFileTableProps {
    plugin: WatchtowerPlugin,
}
export const RecentOpenFileTable: React.FC<RecentOpenFileTableProps> = ({ plugin }) => {
    const [className, setClassName] = React.useState('');
    const sortedFileStats = useSelector((state: RootState) => state.counter.fileStatList)
        .slice()
        .sort((a, b) => b.recentOpen - a.recentOpen)
        .slice(0, 50);

    // const dispatch = useDispatch();

    const handleClick = (index: number) => {
        setClassName((prevClassName) =>
            prevClassName === 'is-active' ? '' : 'is-active'
        );
        plugin.app.workspace.openLinkText(sortedFileStats[index].path, "", true);
        store.dispatch(setFileStatList(sortedFileStats));
    };

    // 右键菜单处理函数
    const handleContextMenu = (event: React.MouseEvent, index: number) => {
        event.preventDefault(); // 阻止默认右键行为

        const fileStat = sortedFileStats[index];

        // 创建右键菜单
        const menu = new Menu();

        // 添加菜单项：打开文件
        menu.addItem((item) => {
            item.setTitle("Open File")
                .setIcon("document")
                .onClick(() => {
                    plugin.app.workspace.openLinkText(fileStat.path, "", true);
                });
        });

        // 添加菜单项：复制文件路径
        menu.addItem((item) => {
            item.setTitle("Copy File Path")
                .setIcon("clipboard-copy")
                .onClick(() => {
                    navigator.clipboard.writeText(fileStat.path);
                });
        });

        // // 添加菜单项：删除文件记录
        // menu.addItem((item) => {
        //     item.setTitle("Remove from List")
        //         .setIcon("trash")
        //         .onClick(() => {
        //             const updatedFileStats = sortedFileStats.filter((_, i) => i !== index);
        //             store.dispatch(setFileStatList(updatedFileStats));
        //         });
        // });

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
                    onContextMenu={(event) => handleContextMenu(event, index)} // 监听右键点击
                >
                    <div className={`tree-item-self nav-file-title tappable is-clickable${className}`}>
                        <div className="tree-item-inner nav-file-title-content">{fileStat.name}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};