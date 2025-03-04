import { configureStore, createSlice } from '@reduxjs/toolkit';

// 定义初始状态
const initialState = {
  count: 0,
};

// 创建一个 slice
const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    decrement: (state) => {
      state.count -= 1;
    },
  },
});

// 导出 actions
export const { increment, decrement } = counterSlice.actions;

// 创建 Redux store
export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// 定义 RootState 类型
export type RootState = ReturnType<typeof store.getState>;