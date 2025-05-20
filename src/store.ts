// store.ts（完整修改方案）
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	DEFAULT_SETTINGS,
	settingsFileStats,
	WatchtowerSettings,
	PluginManager,
} from "./types";

const initialState = {
	/** 最近打开的历史文件列表 */
    fileStatList: [settingsFileStats],
};

const counterSlice = createSlice({
	name: "counter",
	initialState,
	reducers: {
		/** 控制最近打开的历史文件列表 */
		setFileStatList: (state, action) => {
			state.fileStatList = action.payload;
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
		updateMarkTime: (state, action) => {
			state.markTime = action.payload;
		},
		updateFileStats: (state, action) => {
			state.fileStats = action.payload;
		},
		updatePluginManager: (state, action) => {
			state.pluginManager = action.payload;
		},
		updatePluginGroups: (state, action) => {
			state.pluginGroups = action.payload;
		},
	},
});

// --------------------------- 新增 deepSettingsSlice 以后再迁移 ---------------------------
const deepSettingsSlice = createSlice({
	name: "deepSettings",
	initialState: DEFAULT_SETTINGS,
	reducers: {
		// 更新单个插件
		updatePlugin: (state, action: PayloadAction<PluginManager>) => {
			const index = state.pluginManager.findIndex(
				(p) => p.id === action.payload.id
			);
			if (index >= 0) {
				state.pluginManager[index] = {
					...state.pluginManager[index],
					...action.payload,
					switchTime: Date.now(),
				};
			}
		},

		// 通用深层更新方法
		updateNestedField: <T extends keyof WatchtowerSettings>(
			state: WatchtowerSettings,
			action: PayloadAction<{
				key: T;
				value: WatchtowerSettings[T];
			}>
		) => {
			const { key, value } = action.payload;
			state[key] = value;
		},
	},
});

export const { updatePlugin, updateNestedField } = deepSettingsSlice.actions;

// 扩展类型定义
declare module "react-redux" {
	interface DefaultRootState extends RootState {
		deepSettings: WatchtowerSettings;
	}
}

// 修改 store 配置（新增 deepSettings 不删除原有配置）
export const store = configureStore({
	reducer: {
		counter: counterSlice.reducer,
		settings: settingsSlice.reducer,
        deepSettings: deepSettingsSlice.reducer,
	},
});

// 保留原有类型导出
export type RootState = ReturnType<typeof store.getState>;
export const { setFileStatList } = counterSlice.actions;
export const {
	setSettings,
	updateMarkTime,
	updateFileStats,
	updatePluginManager,
    updatePluginGroups,
} = settingsSlice.actions;
