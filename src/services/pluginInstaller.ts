import { requestUrl } from "obsidian";
import WatchtowerPlugin from "../main";

export class PluginInstaller {
	private plugin: WatchtowerPlugin;

	constructor(plugin: WatchtowerPlugin) {
		this.plugin = plugin;
	}

	async install(pluginName: string): Promise<boolean> {
		try {
			// @ts-ignore
			await this.plugin.app.plugins.installPlugin("", pluginName);
			return true;
		} catch (error) {
			console.error(`安装插件失败: ${pluginName}`, error);
			return false;
		}
	}

	async installFromUrl(url: string): Promise<boolean> {
		try {
			const releaseInfo = await this.getReleaseInfo(url);
			if (!releaseInfo) return false;

			const { downloadUrl } = releaseInfo;
			const pluginId = this.extractPluginName(url);

			const response = await requestUrl({ url: downloadUrl });
			if (response.status !== 200) {
				console.error(`下载插件失败: ${downloadUrl}`);
				return false;
			}

			const basePath = this.plugin.app.vault.configDir;
			const pluginDir = `${basePath}/plugins/${pluginId}`;

			await this.plugin.app.vault.adapter.mkdir(pluginDir);
			await this.plugin.app.vault.adapter.write(
				`${pluginDir}/main.js`,
				response.text
			);

			// @ts-ignore
			await this.plugin.app.plugins.loadManifests();
			// @ts-ignore
			await this.plugin.app.plugins.enablePluginAndSave(pluginId);

			return true;
		} catch (error) {
			console.error(`从 URL 安装插件失败: ${url}`, error);
			return false;
		}
	}

	private async getReleaseInfo(
		url: string
	): Promise<{ downloadUrl: string; version: string } | null> {
		try {
			const apiUrl = url.replace(
				"github.com",
				"api.github.com/repos"
			);
			const response = await requestUrl({ url: apiUrl });
			if (response.status !== 200) return null;

			const data = response.json;
			const mainJsAsset = data.assets?.find(
				(a: { name: string }) => a.name === "main.js"
			);
			if (!mainJsAsset) return null;

			return {
				downloadUrl: mainJsAsset.browser_download_url,
				version: data.tag_name,
			};
		} catch {
			return null;
		}
	}

	private extractPluginName(url: string): string {
		const match = url.match(/github\.com\/[^/]+\/([^/]+)/);
		return match ? match[1] : "";
	}
}
