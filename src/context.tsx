// 从 React 中引入 createContext 方法，用于创建上下文（Context）
import { App } from 'obsidian';
import { createContext } from 'react';
/**
 * 创建一个名为 FileHandlerContext 的上下文
 *上下文的类型是一个对象，包含一个异步方法 saveFileInfo，返回 Promise<void>
 *初始值设置为 null，表示在没有提供值时上下文为空
 */
export const FileHandlerContext = createContext<{
    saveFileInfo: () => Promise<void>; // 定义 saveFileInfo 方法的类型
} | null>(null); // 初始值为 null


export const AppContext = createContext<App | null>(null);