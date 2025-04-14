import WatchtowerPlugin from "src/main";

interface GroupView {
    plugin: WatchtowerPlugin;
}
const GroupView: React.FC<GroupView> = ({ plugin }) => {
    


    return (
        <div className="GroupView">
            <div className="GroupView-container">
            </div>
            <div className="GroupView-setting">{/* 设置 */}</div>
        </div>
    );
}

export default GroupView;