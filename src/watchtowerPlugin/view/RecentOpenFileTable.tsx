import * as React from "react";
import WatchtowerPlugin from "src/main";
interface RecentOpenFileTableProps {
    plugin: WatchtowerPlugin;
}
import "./RecentOpenFileTable.css"
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setFileStatList, store } from "../store";


export const RecentOpenFileTable: React.FC<RecentOpenFileTableProps> = ({ plugin }) => {
    const [className, setClassName] = useState('');
    const sortedFileStats = useSelector((state: RootState) => state.counter.fileStatList)
        .slice()
        .sort((a, b) => b.recentOpen - a.recentOpen)
        .slice(0, 50); // 限制返回前五十个数据

    // console.log("sortedFileStats", sortedFileStats);
    const dispatch = useDispatch();
    // console.log(sortedFileStats);
    React.useEffect(() => {
    }, [dispatch, sortedFileStats, setFileStatList]);
    const handleClick = (index: number) => {
        setClassName((prevClassName) =>
            prevClassName === 'is-active'
                ? '' : 'is-active'
        );
        plugin.app.workspace.openLinkText(sortedFileStats[index].path, "", true);
        store.dispatch(setFileStatList(sortedFileStats));
    };

    return (
        <div className="recent-open-file-table">
            {/* 渲染排序后的文件列表 */}
            {sortedFileStats.map((fileStat, index) => (
                <div onClick={() => { handleClick(index) }} className="nav-file" key={index}>
                    <div className={` tree-item-self nav-file-title tappable is-clickable${className}`}>
                        <div className="tree-item-inner nav-file-title-content">{fileStat.name}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};