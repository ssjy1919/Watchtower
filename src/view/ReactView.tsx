import { useSelector, useDispatch } from 'react-redux';
import { useApp } from '../context';
import { RootState, setFileChange } from '../store';
import { fileInfo, timestampToDate } from 'src/functions';
import "./ReactView.css"
export const ReactView = () => {
  const app = useApp();
  const fileCreated = useSelector((state: RootState) => state.counter.fileCreated); // 获取 fileCreated 状态

  const dispatch = useDispatch();

  if (!app) {
    return <h4>Loading...</h4>;
  }
  // 当 fileCreated 状态为 true 时，刷新组件
  if (fileCreated) {
    // 这里可以添加刷新组件的逻辑，例如重新获取文件信息等
    // console.log('File created, refreshing component...');
    // 重置 fileCreated 状态
    dispatch(setFileChange(false));
  }
  
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
              {/* <th>创建时间</th> */}
            </tr>
          </thead>
          <tbody>
          {fileInfo(app).map((file, index) => (
            <tr key={index}>
              <td>{index}</td>
              {/* openFile(file: TFile, openState?: OpenViewState): Promise<void>; */}
              <td>                <a data-tooltip-position="top" aria-label={file.path} data-href={file.path} href={file.path} className="internal-link" target="_blank" rel="noopener nofollow">{ file.name}</a></td>
              <td>{file.stat.size}</td>
              {/* <td>{timestampToDate(file.stat.ctime)}</td> */}
              <td>

                {timestampToDate(file.stat.mtime)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};