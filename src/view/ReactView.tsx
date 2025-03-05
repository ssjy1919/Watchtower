import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useApp } from "src/context";
import { RootState, setFileChange } from "src/store";
import { differentInfos } from "src/types";

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
        {/* 写一个按钮执行 saveFileInfo 函数 */}
        {files.length>0?
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>文件名</th>
              <th>差异</th>
              {/* <th>创建时间</th> */}
            </tr>
          </thead>
          <tbody>
            {files.map((file: differentInfos, index: number) => (
              <tr key={index}>
                <td>{index+1}</td>
                <td>
                  <a data-tooltip-position="top" aria-label={file.path} data-href={file.path} href={file.path}
                    className="internal-link" target="_blank"
                    rel="noopener nofollow">{file.name}</a>
                </td>
                <td>{file.differents}</td>
              </tr>
            ))}
          </tbody>
          </table>
        :<h1>无差异文件</h1>
}
      </div>
    </div>
  );
};

export default ReactView;