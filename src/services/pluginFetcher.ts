import { requestUrl } from "obsidian";

export interface ReleaseInfo {
	version: string;
	downloadUrl: string;
	releaseUrl: string;
}

export class PluginFetcher {
	async getLatestVersion(pluginId: string): Promise<string | null> {
		try {
			const url = `https://api.github.com/repos/${pluginId}/releases/latest`;
			const response = await requestUrl({ url });
			if (response.status !== 200) return null;
			return response.json.tag_name;
		} catch {
			return null;
		}
	}

	async getReleaseInfo(repoUrl: string): Promise<ReleaseInfo | null> {
		try {
			const apiUrl = repoUrl.replace(
				"github.com",
				"api.github.com/repos"
			);
			const releaseUrl = apiUrl.includes("/releases")
				? apiUrl
				: `${apiUrl}/releases/latest`;

			const response = await requestUrl({ url: releaseUrl });
			if (response.status !== 200) return null;

			const data = response.json;
			const mainJsAsset = data.assets?.find(
				(a: { name: string }) => a.name === "main.js"
			);
			if (!mainJsAsset) return null;

			return {
				version: data.tag_name,
				downloadUrl: mainJsAsset.browser_download_url,
				releaseUrl: data.html_url,
			};
		} catch {
			return null;
		}
	}

	extractPluginName(url: string): string {
		const match = url.match(/github\.com\/[^/]+\/([^/]+)/);
		return match?.[1] ?? "";
	}
}
