import { createContext, useState, useContext } from 'react';
import { App } from 'obsidian';

// 创建一个 React 上下文，用于在组件树中共享 Obsidian 的 App 实例
// 初始值为 undefined
export const AppContext = createContext<App | undefined>(undefined);

// 定义一个共享的变量或动作
export const sharedVariable = '共享变量';
export const sharedAction = () => {
  console.log('共享动作');
};

// 定义一个共享的计数器变量和相关的动作
export const useCounter = () => {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  return { count, increment, decrement };
};

// 定义一个自定义 Hook，用于从 AppContext 中获取 Obsidian 的 App 实例
export const useApp = (): App | undefined => {
  return useContext(AppContext);
};