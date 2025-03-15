
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_SETTINGS, settingsFileStats } from "./types";


const initialState = {
	// - fileChange：布尔值，用于标识文件是否发生变化，默认值为 false
	fileChange: false,
	/** 当前文件列表，包含文件路径和状态 */
    fileStatList: [settingsFileStats],
    /* 记录差异文件列表 */
    differentFiles: [settingsFileStats],
    /** 记录打开过的历史文件 */
    recentOpenFiles: [settingsFileStats],

};


const counterSlice = createSlice({
	name: "counter", // slice 的名称，用于区分不同的 slice
	initialState, // 初始状态
	reducers: {
		setFileChange: (state, action) => {
			state.fileChange = action.payload;
		},
		setFileStatList: (state, action) => {
			state.fileStatList = action.payload;
        },
        setDifferentFiles: (state, action) => {
			state.differentFiles = action.payload;
        },
        setRecentOpenFiles: (state, action) => {
			state.recentOpenFiles = action.payload;
        },
	},
});

// 创建一个名为 settingsSlice 的 slice，用于管理插件的设置状态
const settingsSlice = createSlice({
	name: "settings", // slice 的名称，用于区分不同的 slice
	initialState: DEFAULT_SETTINGS, // 初始状态为默认设置 DEFAULT_SETTINGS
	reducers: {
        setSettings: (state, action) => {
			return { ...state, ...action.payload }; 
		},
	},
});

// 导出 actions ，用于在组件中触发状态更新
export const { setFileChange, setFileStatList ,setDifferentFiles,setRecentOpenFiles} = counterSlice.actions;
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
