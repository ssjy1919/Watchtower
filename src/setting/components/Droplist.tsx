import { RecentFilesSaveMode } from "src/types";

/** 下拉组件的属性接口 */
interface DroplistProps {
    label: string;
    description: string;
    value: RecentFilesSaveMode;
    onChange: (value: RecentFilesSaveMode) => void;
}

/** 下拉组件 */
export const Droplist: React.FC<DroplistProps> = ({ label, description, value, onChange }) => {
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">{label}</div>
                <div className="setting-item-description">{description}</div>
            </div>
            <div className="setting-item-control">
                <select
                    value={value}
                    onChange={(e) => {
                        console.log("Droplist onChange value:", e.target.value); // 添加日志
                        onChange(e.target.value as RecentFilesSaveMode);
                    }}
                    className="dropdown"
                >
                    <option value="immediate">即时</option>
                    <option value="manual">手动</option>
                </select>
            </div>
        </div>
    );
};