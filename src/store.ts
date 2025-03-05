import { configureStore, createSlice } from '@reduxjs/toolkit';

// 定义初始状态
const initialState = {
  count: 0,
  fileCreated: false, // 新增 fileCreated 状态
};

// 创建一个 slice
const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    setFileChange: (state, action) => { // 新增 setFileCreated reducer
      state.fileCreated = action.payload;
    },
  },
});


// 导出 actions
export const { setFileChange} = counterSlice.actions;

// 创建 Redux store
export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// 定义 RootState 类型
export type RootState = ReturnType<typeof store.getState>;