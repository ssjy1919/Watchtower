// configureStore 用于创建 Redux store
// createSlice 用于定义 reducer 和 action
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_SETTINGS, defaultFileStatus } from "./types";

// 定义初始状态 initialState
// 包含两个属性：
const initialState = {
	// - fileChange：布尔值，用于标识文件是否发生变化，默认值为 false
	fileChange: false,
	/** 差异文件列表，包含文件路径和状态 */
	differentFiles: [defaultFileStatus],
};

// 创建一个名为 counterSlice 的 slice，用于管理计数器和文件变化状态
const counterSlice = createSlice({
	name: "counter", // slice 的名称，用于区分不同的 slice
	initialState, // 初始状态
	reducers: {
		setFileChange: (state, action) => {
			state.fileChange = action.payload;
		},
		setDifferentFiles: (state, action) => {
			state.differentFiles = action.payload;
		},
	},
});

// 创建一个名为 settingsSlice 的 slice，用于管理插件的设置状态
const settingsSlice = createSlice({
	name: "settings", // slice 的名称，用于区分不同的 slice
	initialState: DEFAULT_SETTINGS, // 初始状态为默认设置 DEFAULT_SETTINGS
	reducers: {
        setSettings: (state, action) => {
            // console.log("settingsSlice.reducer.setSettings", action.payload);
			return { ...state, ...action.payload }; // 使用扩展运算符合并新旧状态
		},
	},
});

// 导出 actions ，用于在组件中触发状态更新
export const { setFileChange, setDifferentFiles } = counterSlice.actions;
export const { setSettings } = settingsSlice.actions;

// 创建 Redux store，将 counterSlice 和 settingsSlice 的 reducer 组合在一起
// store 是整个应用的状态管理核心
export const store = configureStore({
	reducer: {
		counter: counterSlice.reducer, // 将 counterSlice 的 reducer 注册到 store 中
		settings: settingsSlice.reducer, // 将 settingsSlice 的 reducer 注册到 store 中
	},
});

// 定义 RootState 类型，用于获取 store 的状态类型
// ReturnType<typeof store.getState> 表示 store 的状态类型
export type RootState = ReturnType<typeof store.getState>;
