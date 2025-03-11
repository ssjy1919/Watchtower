import { useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setFileChange } from "src/store";
import { differentInfos } from "src/types";
import { AppContext, FileHandlerContext } from '../context';
import { Notice } from "obsidian";
import "./FileSupervision.css"
const FileSupervision: React.FC = () => {
    const app = useContext(AppContext);
    const fileHandlerContext = useContext(FileHandlerContext);
    const fileChange = useSelector((state: RootState) => state.counter.fileChange); // 获取 fileChange 状态
    const differentFiles = useSelector((state: RootState) => state.counter.differentFiles); // 获取 differentFiles 状态
    const settings = useSelector((state: RootState) => state.settings);
    const [className, setClassName] = useState('file-supervision-table-none');

    const dispatch = useDispatch();

    useEffect(() => {
        if (fileChange) {
            // 重置 fileChange 状态
            dispatch(setFileChange(false));
        }
    }, [fileChange, dispatch, differentFiles]);

    const handleClick = () => {
        setClassName((prevClassName) =>
            prevClassName === 'file-supervision-table-none'
                ? 'file-supervision-table-show'
                : 'file-supervision-table-none'
        );
    };
    const HandleSaveFileInfo = async () => {
        if (fileHandlerContext?.saveFileInfo) {
            await fileHandlerContext.saveFileInfo();
        }
    }
    const handleOpenLink = (path: string, differents: string) => {
        if (app) {
            if (differents != "文件丢失") {
                app.workspace.openLinkText(path, '', false); // 调用 openLinkText 方法

            } else {
                new Notice(`文件不存在：${path}`)
            }
        }
    };
    const files = differentFiles;
    console.log(files.length)
    return (
        <div className="file-supervision">
            <div className={`${className} tips`} onClick={handleClick}>
                <div className="show-table">
                    {files.length === 0 ? `版本号：${settings.markTime}` : `${files.length}份文件发生变动`}
                </div>
                <div className="save-file-info" onClick={() => { HandleSaveFileInfo() }}>保存文件信息</div>
            </div>
            <div className={className} >

                    {files.length > 0 ?
                            <table>
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>文件名</th>
                                        <th>差异</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file: differentInfos, index: number) => (
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
                                                        e.preventDefault(); // 阻止默认行为
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
        </div>
    );
};

export default FileSupervision;