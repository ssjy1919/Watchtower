import { join } from "path";
import { normalizePath, Notice } from "obsidian";
import WatchtowerPlugin from "./main";
import {
	CONFIG_FILES,
	ConfigFileMap,
	ConfigFileName,
	FILE_SUPERVISION_STATE,
} from "./types";

/** 配置文件文件服务类 */
export class FileService {
	private static instance: FileService;
	private plugin: WatchtowerPlugin;

	// 监听文件变化并通知订阅者
	private listeners: Map<
		ConfigFileName,
		(data: ConfigFileMap[keyof ConfigFileMap]) => void
	> = new Map();
	// 防抖定时器集合
	private debouncedUpdates: Map<ConfigFileName, number> = new Map();
	// 缓存数据（内存中）
	private cache: Map<ConfigFileName, ConfigFileMap[keyof ConfigFileMap]> =
		new Map();
	private autoSaveCallback?: (
		fileName: ConfigFileName,
		data: ConfigFileMap[keyof ConfigFileMap]
	) => Promise<void>;

	private constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
	}
	/** 初始化自动保存功能，并注册监听器 */
	initializeAutoSave(
		fileName: ConfigFileName,
		callback: (
			fileName: ConfigFileName,
			data: ConfigFileMap[keyof ConfigFileMap]
		) => Promise<void>
	) {
		this.autoSaveCallback = callback;

		// 注册监听器，非obsidian API 提供，不能使用 this.registerEvent，需要手动清理
		this.onFileChange(fileName, async (data) => {
			if (this.autoSaveCallback) {
				await this.autoSaveCallback(fileName, data);
			}
		});
	}

	// 新增清理方法
	clearAllListeners() {
		this.listeners.clear();
		this.autoSaveCallback = undefined;
	}
	/**
	 * 获取配置文件文件服务类单例实例
	 * @param plugin 插件实例（仅第一次调用时需要）
	 * @returns 单例实例
	 */
	public static getInstance(plugin?: WatchtowerPlugin): FileService {
		if (!FileService.instance && plugin) {
			FileService.instance = new FileService(plugin);
		}
		if (!FileService.instance) {
			throw new Error(
				"FileService 未初始化，请先调用 getInstance(plugin)"
			);
		}
		return FileService.instance;
	}

	/**
	 * 构建插件专属文件路径
	 * @param fileName 文件名（含扩展名）
	 * @returns 规范化后的完整文件路径
	 */
	private buildFilePath(fileName: string): string {
		return normalizePath(
			join(
				this.plugin.app.vault.configDir,
				"plugins",
				this.plugin.manifest.id,
				fileName
			)
		);
	}

	// =======================
	// ✅ 防抖更新相关方法
	// =======================

	/**
	 * 带防抖的更新方法, 需要设置监听器 {@link onFileChange}
	 * @param fileName 文件名
	 * @param data 新数据
	 * @param delay 防抖延迟（ms，默认 300ms）
	 */
	debounceUpdate<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName,
		data: T,
		delay = 300
	): void {
		// 清除已有的定时器
		if (this.debouncedUpdates.has(fileName)) {
			clearTimeout(this.debouncedUpdates.get(fileName));
		}

		// 设置新的定时器
		const timer = setTimeout(async () => {
			await this.updateAndNotify(fileName, data);
			this.debouncedUpdates.delete(fileName);
		}, delay) as unknown as number;

		this.debouncedUpdates.set(fileName, timer);
	}

	/**
	 * 强制立即执行更新（如插件卸载前）
	 * @param fileName 文件名
	 * @param data 新数据
	 */
	forceUpdate<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName,
		data: T
	): void {
		// 立即清除防抖
		if (this.debouncedUpdates.has(fileName)) {
			clearTimeout(this.debouncedUpdates.get(fileName));
			this.debouncedUpdates.delete(fileName);
		}

		// 立即更新
		this.updateAndNotify(fileName, data);
	}

	// =======================
	// ✅ 缓存相关方法
	// =======================

	/**
	 * 获取文件缓存（优先从内存读取）
	 * @param fileName 文件名
	 * @returns 缓存数据或 null
	 */
	async getCachedFile<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName
	): Promise<T | null> {
		if (this.cache.has(fileName)) {
			return this.cache.get(fileName) as T;
		}

		const data = await this.readFile<T>(fileName);
		if (data) {
			this.cache.set(fileName, data);
		}
		return data;
	}

	/**
	 * 手动清除指定文件的缓存
	 * @param fileName 文件名
	 */
	clearCache(fileName: ConfigFileName): void {
		this.cache.delete(fileName);
	}

	/**
	 * 带缓存合并的防抖更新
	 * @param fileName 文件名
	 * @param newData 新数据
	 */
	async debouncedUpdateWithCache<
		T extends ConfigFileMap[keyof ConfigFileMap]
	>(fileName: ConfigFileName, newData: T): Promise<void> {
		const cached = await this.getCachedFile<T>(fileName);

		// 根据文件类型选择默认值
		let defaultValue: T;
		if (fileName === CONFIG_FILES.FILE_SUPERVISION_STATE) {
			defaultValue = FILE_SUPERVISION_STATE as T;
			// } else if (fileName === CONFIG_FILES.NEW_DATA) {
			// 	defaultValue = DEFAULT_NEW_DATA_FORMAT as T;
		} else {
			throw new Error(`未知配置文件类型: ${fileName}`);
		}

		// 使用默认值替代空对象 {}
		const merged = this.deepMerge(cached || defaultValue, newData);
		this.debounceUpdate(fileName, merged);
	}

	private deepMerge<T>(target: T, source: Partial<T>): T {
		// 处理基本类型和 null
		if (source === null || typeof source !== "object") {
			return source as T;
		}

		// 处理数组（直接覆盖）
		if (Array.isArray(source)) {
			return source.map((item, i) => {
				const targetArray = Array.isArray(target) ? target : [];
				return this.deepMerge(targetArray[i] || {}, item);
			}) as unknown as T;
		}

		// 处理对象（递归合并）
		const result: any = { ...(target as any) };
		for (const key in source) {
			if (source.hasOwnProperty(key)) {
				const value = source[key];
				if (value === undefined) continue; // 跳过 undefined 值
				if (typeof value === "object" && !Array.isArray(value)) {
					result[key] = this.deepMerge(
						result[key] || {},
						value as Partial<any>
					);
				} else {
					result[key] = value;
				}
			}
		}
		return result as T;
	}

	// =======================
	// ✅ 文件读写方法
	// =======================

	/**
	 * 创建/更新文件并通知监听者（带防抖能力）
	 * @param fileName 文件名
	 * @param newData 新数据
	 */
	updateAndNotify<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName,
		newData: T
	): void {
		if (this.listeners.has(fileName)) {
			this.listeners.get(fileName)?.(newData);
		}
	}

	/**
	 * 创建/更新文件（仅负责底层文件操作）
	 * @param fileName 文件名
	 * @param content 内容（自动 JSON.stringify）
	 */
	async createOrUpdateFile<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName,
		content: T
	): Promise<void> {
		const filePath = this.buildFilePath(fileName);
		const jsonData = JSON.stringify(content, null, 2);

		try {
			await this.plugin.app.vault.adapter.write(filePath, jsonData);
			console.log(`文件创建/更新成功: ${filePath}`);
			this.cache.set(fileName, content); // 更新缓存
		} catch (error) {
			console.error(`写入文件失败 ${filePath}:`, error);
			new Notice(`文件操作失败: ${fileName}`);
			throw error;
		}
	}

	/**
	 * 读取文件内容（优先从缓存读取）
	 * @param fileName 文件名
	 * @returns 解析后的 JSON 对象，文件不存在返回 null
	 */
	async readFile<T extends ConfigFileMap[keyof ConfigFileMap]>(
		fileName: ConfigFileName
	): Promise<T | null> {
		const filePath = this.buildFilePath(fileName);

		try {
			const exists = await this.plugin.app.vault.adapter.exists(filePath);
            if (!exists) {
                
				console.warn(`文件不存在: ${filePath}`);
				return null;
			}

			const data = await this.plugin.app.vault.adapter.read(filePath);
			const parsed = JSON.parse(data) as T;

			this.cache.set(fileName, parsed); // 更新缓存
			return parsed;
		} catch (error) {
			console.error(`读取文件失败 ${filePath}:`, error);
			new Notice(`读取文件失败: ${fileName}`);
			throw error;
		}
	}

	/**
	 * 删除文件并清除缓存
	 * @param fileName 文件名
	 */
	async deleteFile(fileName: ConfigFileName): Promise<void> {
		const filePath = this.buildFilePath(fileName);

		try {
			const exists = await this.plugin.app.vault.adapter.exists(filePath);
			if (!exists) {
				console.warn(`文件不存在: ${filePath}`);
				return;
			}

			await this.plugin.app.vault.adapter.remove(filePath);
			console.log(`文件删除成功: ${filePath}`);
			this.cache.delete(fileName); // 清除缓存
		} catch (error) {
			console.error(`删除文件失败 ${filePath}:`, error);
			new Notice(`删除文件失败: ${fileName}`);
			throw error;
		}
	}

	/**
	 * 检查文件是否存在
	 * @param fileName 文件名
	 * @returns 是否存在
	 */
	async fileExists(fileName: ConfigFileName): Promise<boolean> {
		const filePath = this.buildFilePath(fileName);
		return await this.plugin.app.vault.adapter.exists(filePath);
	}

	/**
	 * 列出目录下所有文件
	 * @returns 文件名数组
	 */
	async listFiles(): Promise<string[]> {
		const dirPath = normalizePath(
			join(
				this.plugin.app.vault.configDir,
				"plugins",
				this.plugin.manifest.id
			)
		);

		try {
			const { files } = await this.plugin.app.vault.adapter.list(dirPath);
			return files || [];
		} catch (error) {
			console.error(`列出文件失败 ${dirPath}:`, error);
			return [];
		}
	}

	// =======================
	// ✅ 监听器方法
	// =======================

	/**
	 * 监听文件变化并注册回调
	 * @param fileName 文件名
	 * @param callback 回调函数
	 */
	onFileChange(
		fileName: ConfigFileName,
		callback: (data: ConfigFileMap[keyof ConfigFileMap]) => void
	): () => void {
		this.listeners.set(fileName, callback);

		// 返回取消监听的函数
		return () => {
			this.listeners.delete(fileName);
		};
	}
}
