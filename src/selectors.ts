import { createSelector } from "reselect";
import { RootState } from "src/store";

const getSettings = (state: RootState) => state.settings;

export const getNormalizedExcludeSuffixes = createSelector(
	[getSettings],
	(settings) => {
		return (settings.recentFileExcludes || []).map((s) =>
			s.trim().toLowerCase()
		);
	}
);

// export const getNormalizedMonitoredExcludes = createSelector(
// 	[getSettings],
// 	(settings) => {
// 		return (settings.MonitoredFileExcludes || []).map(s => 
// 			s.trim().toLowerCase()
// 		);
// 	}
// );


export const getFilteredFileStats = createSelector(
	[getSettings, getNormalizedExcludeSuffixes],
	(settings, normalizedSuffixes) => {
		return settings.fileStats.filter((fileStat) => {
			const extMatch = fileStat.name.match(/\.([^.]+)$/);
			const fileExt = extMatch ? extMatch[1].toLowerCase() : "";
			return (
				fileStat.differents !== "未找到" &&
				fileStat.differents !== "已删除" &&
				!normalizedSuffixes.some((suffix) => suffix === fileExt)
			);
		});
	}
);
