/**设置页面的开关按钮*/
interface SwitchProps {
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ label, description, value, onChange }) => {
    return (
        <div className="setting-item">
            <div className="setting-item-info">
                <div className="setting-item-name">{label}</div>
                <div className="setting-item-description">{description}</div>
            </div>
            <div className="setting-item-control">
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                    <span className="slider"></span>
                </label>
            </div>
        </div>
    );
};