// store.ts（完整修改方案）
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
	DEFAULT_SETTINGS,
	WatchtowerSettings,
	FileSupervisionData,
    FILE_SUPERVISION_STATE,
} from "./types";

const settingsSlice = createSlice({
	name: "settings",
	initialState: DEFAULT_SETTINGS,
	reducers: {
		updataSettings: (state, action) => {
			return { ...state, ...action.payload };
        },
		updataFileStats: (state, action) => {
			state.fileStats = action.payload;
		},
		updataPluginManager: (state, action) => {
			state.pluginManager = action.payload;
		},
		updataPluginGroups: (state, action) => {
			state.pluginGroups = action.payload;
		},
	},
});

const FsStateSlice = createSlice({
	name: "fileSupervision",
	initialState: FILE_SUPERVISION_STATE,
	reducers: {
		updataFSstates: (state, action) => {
			return { ...state, ...action.payload };
        },
		updataFsFileStats: (state, action) => {
			state.fileStats = action.payload;
		},
		updataFsMarkTime: (state, action: PayloadAction<string>) => {
			state.markTime = action.payload;
		},

		// 字段级更新方法
		updataField: <K extends keyof FileSupervisionData>(
			state: FileSupervisionData,
			action: PayloadAction<{ field: K; value: FileSupervisionData[K] }>
		) => {
			state[action.payload.field] = action.payload.value;
		},
	},
});
// 扩展类型定义
declare module "react-redux" {
	interface DefaultRootState extends RootState {
		deepSettings: WatchtowerSettings;
	}
}

export const store = configureStore({
	reducer: {
        settings: settingsSlice.reducer,
        fsState:FsStateSlice.reducer,
	},
});

// 保留原有类型导出
export type RootState = ReturnType<typeof store.getState>;
export const {
    updataSettings,
    /** state.fileStats 文件状态专用更新 */
	updataFileStats,
	updataPluginManager,
    updataPluginGroups,
} = settingsSlice.actions;
export const {
    /** file_supervision_state 文件完整更新 */
    updataFSstates,
	updataFsFileStats,
	updataFsMarkTime,
	updataField,
} = FsStateSlice.actions;
