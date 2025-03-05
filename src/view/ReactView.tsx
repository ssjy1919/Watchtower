import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useApp } from "src/context";
import { timestampToDate } from "src/functions";
import { RootState, setFileChange } from "src/store";
import { settingsFileStats } from "src/types";

const ReactView: React.FC = () => {
  const app = useApp();
  const fileChange = useSelector((state: RootState) => state.counter.fileChange); // 获取 fileChange 状态
  const differentFiles = useSelector((state: RootState) => state.counter.differentFiles); // 获取 differentFiles 状态

  const dispatch = useDispatch();

  useEffect(() => {
    if (fileChange) {
      // 重置 fileChange 状态
      dispatch(setFileChange(false));
    }
  }, [fileChange, dispatch,differentFiles]);

  if (!app) {
    return <h4>Loading...</h4>;
  }

  const files = differentFiles; // 使用 differentFiles 替换 settingInfo(settings)
  return (
    <div>
      <div className='ReactViewTable'>
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>文件名</th>
              <th>文件大小</th>
              <th>修改时间</th>
              <th>差异</th>
              {/* <th>创建时间</th> */}
            </tr>
          </thead>
          <tbody>
            {files.map((file: settingsFileStats, index: number) => (
              <tr key={index}>
                <td>{index}</td>
                <td>
                  <a data-tooltip-position="top" aria-label={file.path} data-href={file.path} href={file.path}
                    className="internal-link" target="_blank"
                    rel="noopener nofollow">{file.name}</a>
                </td>
                <td>{file.stat.size}</td>
                <td>{timestampToDate(file.stat.mtime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReactView;