import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "src/store";
import { Notice } from "obsidian";
import "./fileSupervisionView.css"
import WatchtowerPlugin from "src/main";
import { RecentOpenFileTable } from "../recentFile/RecentOpenFileTable";

interface FileSupervisionProps {
    plugin: WatchtowerPlugin;
}

const FileSupervision: React.FC<FileSupervisionProps> = ({ plugin }) => {
    const stoerFsState = useSelector((state: RootState) => state.fsState);
    const fileStats = useSelector((state: RootState) => state.settings.fileStats);
    const [className, setClassName] = useState('file-supervision-table-none');

    const differentFiles = useMemo(() => {
        return fileStats.filter((file) => file.differents !== "");
    }, [fileStats]);
    const handleClick = () => {
        setClassName((prevClassName) =>
            prevClassName === 'file-supervision-table-none'
                ? 'file-supervision-table-show'
                : 'file-supervision-table-none'
        );
    };
    const HandleSaveFileInfo = async () => {

        // 保存文件信息并获取最新数据
        await plugin.fileHandler.saveFileInfo();
        // 提示用户保存成功
        new Notice("文件信息已保存！");
        setClassName(() => 'file-supervision-table-none');
    };

    const handleOpenLink = (path: string, differents: string) => {
        if (differents != "未找到" && differents != "已删除") {
            plugin.app.workspace.openLinkText(path, '', false);
        } else {
            new Notice(`文件不存在：${path}`)
        }

    };
    return (
        <div className="file-supervision">
            <div className={`${className} tips`} >
                <div className="show-table" onClick={handleClick}>
                    {differentFiles.length == 0 ? `${stoerFsState.markTime} √` : <div>{stoerFsState.markTime}  🐾{differentFiles.length}</div>}
                </div>
                <div className="save-file-info" onClick={() => { HandleSaveFileInfo() }}>🔄️</div>
            </div>
            <div className={className} >
                {differentFiles.length > 0 ?
                    <table>
                        <thead>
                            <tr>
                                <th>序列</th>
                                <th>文件名</th>
                                <th>差异</th>
                            </tr>
                        </thead>
                        <tbody>
                            {differentFiles.map((file, index: number) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <a
                                            data-tooltip-position="top"
                                            aria-label={file.path}
                                            data-href={file.path}
                                            href={file.path}
                                            className="internal-link"
                                            target="_blank"
                                            rel="noopener nofollow"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleOpenLink(file.path, file.differents); // 使用 app 打开链接
                                            }}
                                        >
                                            {file.name}
                                        </a>
                                    </td>
                                    <td>{file.differents}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    : <div className="markTime">笔记库文件完整，记录时间：<br />{stoerFsState.markTime}</div>}
            </div>
            <RecentOpenFileTable plugin={plugin} />
        </div>
    );
};

export default FileSupervision;