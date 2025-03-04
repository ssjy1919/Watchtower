import { useSelector, useDispatch } from 'react-redux';
import { useApp, sharedVariable } from '../context';
import { RootState, increment, decrement } from '../store';
import { fileInfo, timestampToDate } from 'src/functions';
import "./ReactView.css"
export const ReactView = () => {
  const app = useApp();
  const count = useSelector((state: RootState) => state.counter.count);
  const dispatch = useDispatch();

  if (!app) {
    return <h4>Loading...</h4>;
  }

  
  return (
    <div>
      <h3>{app.vault.getName()}</h3>
      <h5>{app.workspace.getActiveFile()?.name}</h5>
      <div>{sharedVariable}</div>
      <div>
        <p>计数器: {count}</p>
        <button onClick={() => dispatch(decrement())}>减少</button>
        <button onClick={() => dispatch(increment())}>增加</button>
      </div>
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
          {fileInfo().map((file, index) => (
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