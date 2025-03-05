import { configureStore, createSlice } from '@reduxjs/toolkit';
import { DEFAULT_SETTINGS, differentInfo } from "./types";

// 定义初始状态
const initialState = {
  fileChange: false, // 新增 fileChange 状态，用于标识文件是否发生变化
  differentFiles:  [differentInfo], // 新增 differentFiles 状态，用于存储不同的文件信息
};
// compareFileStats(useApp as App,Setting)
// 创建一个 counter slice，用于管理计数器和文件变化状态
const counterSlice = createSlice({
  name: 'counter', // slice 的名称
  initialState, // 初始状态
  reducers: {
    // 新增 setFileChange reducer，用于更新 fileChange 状态
    setFileChange: (state, action) => {
      state.fileChange = action.payload;
    },
    // 新增 setDifferentFiles reducer，用于更新 differentFiles 状态
    setDifferentFiles: (state, action) => {
      state.differentFiles = action.payload;
    },
  },
});

// 创建一个 settings slice，用于管理插件的设置状态
const settingsSlice = createSlice({
  name: 'settings', // slice 的名称
  initialState: DEFAULT_SETTINGS, // 初始状态为默认设置
  reducers: {
    // 新增 setSettings reducer，用于更新 settings 状态
    setSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

// 导出 actions，用于在组件中触发状态更新
export const { setFileChange, setDifferentFiles } = counterSlice.actions;
export const { setSettings } = settingsSlice.actions;

// 创建 Redux store，将 counter 和 settings reducer 组合在一起
export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

// 定义 RootState 类型，用于获取 store 的状态类型
export type RootState = ReturnType<typeof store.getState>;