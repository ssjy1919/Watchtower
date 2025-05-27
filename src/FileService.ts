import { normalizePath, Notice } from "obsidian";
import WatchtowerPlugin from "./main";
import { ConfigFileMap, ConfigFileName } from "./types";

/** 配置文件文件服务类 */
export class FileService {
	private static instance: FileService;
	private plugin: WatchtowerPlugin;

	private constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
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
	// 修改 FileService.ts 的 buildFilePath 方法
	private buildFilePath(fileName: string): string {
		const basePath = this.plugin.app.vault.configDir;
		const pluginId = this.plugin.manifest.id;
		const rawPath = `${basePath}/plugins/${pluginId}/${fileName}`;
		const safePath = normalizePath(rawPath);
		return safePath;
	}
	/**
	 * 创建/更新文件
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
		} catch (error) {
			console.error(`写入文件失败 ${filePath}:`, error);
			new Notice(`文件操作失败: ${fileName}`);
			throw error;
		}
	}

	/**
	 * 读取文件内容
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
				return {
					markTime: this.plugin.settings.markTime,
					fileStats: this.plugin.settings.fileStats,
				} as T;
			}
			const data = await this.plugin.app.vault.adapter.read(filePath);
			const parsed = JSON.parse(data) as T;
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
			`${this.plugin.app.vault.configDir}/plugins/${this.plugin.manifest.id}`
		);

		try {
			const { files } = await this.plugin.app.vault.adapter.list(dirPath);
			return files || [];
		} catch (error) {
			console.error(`列出文件失败 ${dirPath}:`, error);
			return [];
		}
	}
}
