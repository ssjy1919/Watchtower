import { createContext, useContext } from 'react';
import { App } from 'obsidian';

// 创建一个 React 上下文，用于在组件树中共享 Obsidian 的 App 实例
// 初始值为 undefined
export const AppContext = createContext<App | undefined>(undefined);

// 定义一个自定义 Hook，用于从 AppContext 中获取 Obsidian 的 App 实例
export const useApp = (): App | undefined => {
  return useContext(AppContext);
};