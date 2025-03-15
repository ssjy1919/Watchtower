import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setFileChange } from "src/watchtowerPlugin/store";
import { Notice } from "obsidian";
import "./FileSupervisionView.css"
import WatchtowerPlugin from "src/main";
import { RecentOpenFileTable } from "./RecentOpenFileTable";

interface FileSupervisionProps {
    plugin: WatchtowerPlugin;
}

const FileSupervision: React.FC<FileSupervisionProps> = ({ plugin }) => {
    const fileChange = useSelector((state: RootState) => state.counter.fileChange);
    const differentFiles = useSelector((state: RootState) => state.counter.differentFiles);
    const settings = useSelector((state: RootState) => state.settings);
    const [className, setClassName] = useState('file-supervision-table-none');
    const dispatch = useDispatch();
    useEffect(() => {
        if (fileChange) {
            // 重置 fileChange 状态
            dispatch(setFileChange(false));
        }
    }, [fileChange, dispatch, differentFiles, settings, setFileChange]);
    const handleClick = () => {
        setClassName((prevClassName) =>
            prevClassName === 'file-supervision-table-none'
                ? 'file-supervision-table-show'
                : 'file-supervision-table-none'
        );
    };
    const HandleSaveFileInfo = async () => {
        try {
            // 保存文件信息并获取最新数据
            await plugin.fileHandler.saveFileInfo();
            // const differentFiles = plugin.fileHandler.compareFiles();
            // const fileStats = plugin.fileHandler.loadFileStats();

            
            // // store.dispatch(setDifferentFiles([]));
            // plugin.fileHandler.updateState(fileStats, differentFiles);
            // 更新 settings.fileStats

            
            // 提示用户保存成功
            new Notice("文件信息已保存！");
        } catch (error) {
            console.error("保存文件信息失败：", error);
            new Notice("保存文件信息失败，请检查控制台日志。");
        }
    };

    const handleOpenLink = (path: string, differents: string) => {
        if (differents != "文件丢失") {
            plugin.app.workspace.openLinkText(path, '', false);
        } else {
            new Notice(`文件不存在：${path}`)
        }

    };
    return (
        <div className="file-supervision">
            <div className={`${className} tips`} onClick={handleClick}>
                <div className="show-table">
                    {differentFiles.length == 0 ? settings.markTime : `${differentFiles.length}份文件变动`}
                </div>
                <div className="save-file-info" onClick={() => { HandleSaveFileInfo() }}>保存文件信息</div>
            </div>
            <div className={className} >
                {differentFiles.length > 0 ?
                    <table>
                        <thead>
                            <tr>
                                <th>序号</th>
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
                    : <h4>笔记库文件完整</h4>}
            </div>
            <RecentOpenFileTable plugin={plugin} />
        </div>
    );
};

export default FileSupervision;