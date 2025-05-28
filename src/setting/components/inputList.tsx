
interface InputListProps {
	value: string[];
	onChange: (suffixes: string[]) => void;
	onBlur: (suffixes: string[]) => void;  // 可选
	label: string;
	description: string;
	placeholder?: string;
	className?: string;
	rows?: number;
	allowNumbersOnly?: boolean;
}

export const InputList: React.FC<InputListProps> = ({
	value,
	onChange,
	onBlur,
	label,
	description,
	placeholder = "输入文件后缀（每行一个）",
	className = "exclude-suffix-input",
	rows = 3,
	allowNumbersOnly = false
}) => {

	const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
		if (onBlur) {
			const rawValue = e.target.value.replace(/\r\n/g, '\n');
			const lines = rawValue.split('\n');
			const newValue = lines.slice(0, -1).concat(lines[lines.length - 1] || ['']);
			onBlur(newValue); // 失焦时触发保存
		}
	};
	return (
		<div className="setting-item">
			<div className="setting-item-info">
				<div className="setting-item-name">{label}</div>
				<div className="setting-item-description">{description}</div>
			</div>
			<div className="setting-item-control">
				<textarea
					className={className}
					value={value.join('\n')}
					onChange={(e) => {
						// const newValue = e.target.value.split('\n').filter(s => s !== '');

						const rawValue = e.target.value;
						let newValue = rawValue.split('\n');

						// 🔢 数字限制逻辑
						if (allowNumbersOnly) {
							newValue = newValue.map(line =>
								line.replace(/[^0-9]/g, '') 
							).filter(line => line !== '' && parseInt(line) > 0); // 仅保留 > 0 的正整数
						}
						onChange(newValue); // 触发父组件更新
					}}
					onBlur={handleBlur}      // 新增
					placeholder={placeholder}
					rows={rows}
				/>
			</div>
		</div>
	);
};
