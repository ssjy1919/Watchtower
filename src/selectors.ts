import { createSelector } from 'reselect';
import { RootState } from './store';
//使用memoized selectors可以优化状态读取逻辑，留着备用
// 原始 selector：获取 settings
const selectSettings = (state: RootState) => state.settings;

// Memoized selector：获取 settings
export const selectPluginSettings = createSelector(
    [selectSettings],
    (settings) => settings
);


// Memoized selector：获取 fileStats
export const selectFileStats = createSelector(
    [selectSettings],
    (settings) => settings.fileSupervision.fileStats
);

// Memoized selector：获取 pluginManager
export const selectPluginManager = createSelector(
    [selectSettings],
    (settings) => settings.pluginManager
);

// 新增：Memoized selector：获取 differents 不为空的文件列表
export const selectDifferentFiles = createSelector(
    [selectFileStats],
    (fileStats) => fileStats.filter((file) => file.differents !== "")
);

// Memoized selector：获取 markTime
export const selectMarkTime = createSelector(
    [selectSettings],
    (settings) => settings.fileSupervision.markTime
);