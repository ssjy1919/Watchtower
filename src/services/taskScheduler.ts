import { Notice } from "obsidian";
import WatchtowerPlugin from "../main";
import { IScheduledTask } from "../types";
import { DEFAULT_TASK } from "../constants";
import { PluginFetcher } from "./pluginFetcher";

export class TaskScheduler {
	private plugin: WatchtowerPlugin;
	private timers: Map<string, number> = new Map();
	private tasks: IScheduledTask[] = [];
	private fetcher: PluginFetcher;

	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
		this.fetcher = new PluginFetcher();
	}

	initialize() {
		this.tasks = this.loadTasks();
		this.startAll();
	}

	destroy() {
		this.stopAll();
	}

	private loadTasks(): IScheduledTask[] {
		try {
			// @ts-ignore
			const savedTasks = this.plugin.settings.scheduledTasks;
			if (Array.isArray(savedTasks)) {
				return savedTasks;
			}
		} catch {
			// ignore
		}
		return [];
	}

	private saveTasks() {
		// @ts-ignore
		this.plugin.settings.scheduledTasks = this.tasks;
		// @ts-ignore
		this.plugin.saveData(this.plugin.settings);
	}

	addTask(
		task: Omit<IScheduledTask, "id" | "lastRun">
	): IScheduledTask {
		const newTask: IScheduledTask = {
			...DEFAULT_TASK,
			...task,
			id: this.generateId(),
		};
		this.tasks.push(newTask);
		this.saveTasks();

		if (newTask.enabled) {
			this.startTask(newTask);
		}

		return newTask;
	}

	removeTask(id: string) {
		this.stopTask(id);
		this.tasks = this.tasks.filter((t) => t.id !== id);
		this.saveTasks();
	}

	updateTask(id: string, updates: Partial<IScheduledTask>) {
		const index = this.tasks.findIndex((t) => t.id === id);
		if (index === -1) return;

		const wasEnabled = this.tasks[index].enabled;
		this.tasks[index] = { ...this.tasks[index], ...updates };
		this.saveTasks();

		if (wasEnabled) this.stopTask(id);
		if (this.tasks[index].enabled) {
			this.startTask(this.tasks[index]);
		}
	}

	getTasks(): IScheduledTask[] {
		return [...this.tasks];
	}

	private startAll() {
		for (const task of this.tasks) {
			if (task.enabled) {
				this.startTask(task);
			}
		}
	}

	private stopAll() {
		for (const [id] of this.timers) {
			this.stopTask(id);
		}
	}

	private startTask(task: IScheduledTask) {
		if (this.timers.has(task.id)) {
			this.stopTask(task.id);
		}

		const timerId = window.setInterval(() => {
			this.executeTask(task.id);
		}, task.interval);

		this.timers.set(task.id, timerId);
	}

	private stopTask(id: string) {
		const timerId = this.timers.get(id);
		if (timerId !== undefined) {
			window.clearInterval(timerId);
			this.timers.delete(id);
		}
	}

	private async executeTask(id: string) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;

		try {
			switch (task.type) {
				case "check":
					await this.checkForUpdates(task);
					break;
				case "update":
					await this.performUpdate(task);
					break;
				default:
					console.warn(`未知任务类型: ${task.type}`);
			}

			task.lastRun = Date.now();
			this.saveTasks();
		} catch (error) {
			console.error(`执行任务失败 [${task.id}]:`, error);
		}
	}

	private async checkForUpdates(task: IScheduledTask) {
		const { pluginId } = task;
		if (!pluginId) return;

		const latestVersion = await this.fetcher.getLatestVersion(pluginId);
		if (!latestVersion) return;

		// @ts-ignore
		const manifests = this.plugin.app.plugins.manifests;
		const currentVersion = manifests?.[pluginId]?.version;

		if (currentVersion && currentVersion !== latestVersion) {
			new Notice(
				`插件 ${pluginId} 有新版本: ${latestVersion}`,
				5000
			);
		}
	}

	private async performUpdate(task: IScheduledTask) {
		await this.checkForUpdates(task);
	}

	private generateId(): string {
		return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
}
