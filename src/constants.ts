import { IScheduledTask, ISchedulerConfig } from "./types";

export const DEFAULT_SCHEDULER_CONFIG: ISchedulerConfig = {
	enabled: true,
	defaultInterval: 3600000,
	maxConcurrent: 3,
};

export const DEFAULT_TASK: Omit<IScheduledTask, "id"> = {
	pluginId: "",
	type: "check",
	interval: 3600000,
	enabled: true,
};
