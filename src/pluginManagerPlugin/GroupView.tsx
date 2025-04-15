import WatchtowerPlugin from "src/main";
import "./GroupView.css"
import  { useState } from "react";

interface GroupView {
    plugin: WatchtowerPlugin;
}

const GroupView: React.FC<GroupView> = ({ plugin }) => {
    // 定义输入框的显示状态
    const [isInputVisible, setInputVisible] = useState(false);

    // 切换输入框显示状态的函数
    const toggleInputVisibility = () => {
        setInputVisible(!isInputVisible);
    };

    return (
        <div className="GroupView">
            <div className="GroupView-container">
                {/* 根据状态决定是否显示输入框 */}
                {isInputVisible && <input type="text" placeholder="请输入内容" />}
            </div>
            <div className="GroupView-setting">
                {/* 加号按钮，点击切换输入框显示状态 */}
                <button onClick={toggleInputVisibility}>➕</button>
            </div>
        </div>
    );
};

export default GroupView;