
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { DEFAULT_SETTINGS, settingsFileStats } from "./types";


const initialState = {
	// - fileChange：布尔值，用于标识文件是否发生变化，默认值为 false
	fileChange: false,
	/** 当前文件列表，包含文件路径和状态 */
    fileStatList: [...[settingsFileStats]], 
    /* 记录差异文件列表 */
    differentFiles: [...[settingsFileStats]], 

};


const counterSlice = createSlice({
	name: "counter",
	initialState, 
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
	},
});

const settingsSlice = createSlice({
	name: "settings", 
	initialState: DEFAULT_SETTINGS, 
	reducers: {
        setSettings: (state, action) => {
			return { ...state, ...action.payload }; 
		},
	},
});

// 导出 actions ，用于在组件中触发状态更新
export const { setFileChange, setFileStatList ,setDifferentFiles} = counterSlice.actions;
export const { setSettings } = settingsSlice.actions;


export const store = configureStore({
	reducer: {
		counter: counterSlice.reducer, 
		settings: settingsSlice.reducer, 
	},
});

export type RootState = ReturnType<typeof store.getState>;
