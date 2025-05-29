import * as React from "react";
import { Menu, Notice } from "obsidian";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import WatchtowerPlugin from "src/main";
import "./RecentOpenFileTable.css"
import { useMemo } from "react";
import { getNormalizedExcludeSuffixes } from "src/selectors";

interface RecentOpenFileTableProps {
	plugin: WatchtowerPlugin,
}
export const RecentOpenFileTable: React.FC<RecentOpenFileTableProps> = ({ plugin }) => {
	const [className, setClassName] = React.useState('');
	const recentFilesOpenMode = useSelector((state: RootState) => state.settings.recentFilesOpenMode);
	const fileStats = useSelector((state: RootState) => state.settings.recentOpenFile);
	const recentFilesCount= useSelector((state: RootState) => state.settings.recentFilesCount);
	const excludeFileSuffix = useSelector(getNormalizedExcludeSuffixes);
	const sortedFileStats = useMemo(() => {
		return fileStats
			.filter(fileStat => {
				return (
					!excludeFileSuffix.some(suffix => suffix.toLowerCase() === fileStat.extension)
				);
			})
			.sort((a, b) => b.recentOpen - a.recentOpen);
	}, [fileStats, excludeFileSuffix]);
	const handleClick = async (index: number) => {
		setClassName((prevClassName) =>
			prevClassName === 'is-active' ? '' : 'is-active'
		);

		await plugin.app.workspace.openLinkText(sortedFileStats[index].path, "", recentFilesOpenMode);

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
				.onClick(async () => {
					await plugin.app.workspace.openLinkText(fileStat.path, "", false);
				});
		});

		// 添加菜单项：新标签页打开文件
		menu.addItem((item) => {
			item.setTitle("在新标签页中打开")
				.setIcon("lucide-file-plus")
				.onClick(async () => {
					await plugin.app.workspace.openLinkText(fileStat.path, "", true);
				});
		});

		// 添加菜单项：复制文件路径
		menu.addItem((item) => {
			item.setTitle("复制路径")
				.setIcon("clipboard-copy")
				.onClick(async () => {
					await navigator.clipboard.writeText(fileStat.path);
					new  Notice("已复制到剪贴板");
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
						<div className="tree-item-inner nav-file-title-content">{fileStat.extension === "md" ? fileStat.basename : fileStat.name}</div>
					</div>
				</div>
				// 限制历史文件的数量
			)).slice(0, recentFilesCount)}
		</div>
	);
};
