import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
	// 基础规则（ESLint 推荐规则）
	js.configs.recommended,

	// TypeScript 支持
	{
		files: ["**/*.ts", "**/*.tsx"], // 检查 TypeScript 文件
		languageOptions: {
			parser: tsParser, // 使用 TypeScript 解析器
			parserOptions: {
				ecmaVersion: "latest", // 支持最新的 ECMAScript 特性
				sourceType: "module", // 使用模块化语法
				project: "./tsconfig.json", // 引用项目的 tsconfig.json
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin, // 引入 TypeScript 插件
		},
		rules: {
			// 启用 TypeScript 推荐规则
			"require-await": "error", // 确保 async 函数中使用了 await
			"@typescript-eslint/require-await": "error", // 针对 TypeScript 的规则
			...tsPlugin.configs["recommended"].rules,
			// 自定义规则，"off" 或 0：关闭规则。
			// "warn" 或 1：将规则设置为警告（不会导致构建失败）。
			// "error" 或 2：将规则设置为错误（会导致构建失败）。
			//在某些版本的 ESLint 或 @typescript-eslint 插件中，数字形式（如 1）可能不被完全支持
			// 关闭 no-redeclare 规则，避免与 TypeScript 冲突
			"no-redeclare": "off",
			"no-mixed-spaces-and-tabs": "off",  // 禁用混合空格和制表符检查
			"@typescript-eslint/no-unused-vars": "warn", // 检查未使用的变量
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-function-return-type": "off", // 不强制显式函数返回类型
			"@typescript-eslint/no-non-null-assertion": "warn", // 警告非空断言
			"@typescript-eslint/ban-ts-comment": "off", // 允许使用 @ts-ignore 等 TypeScript 注释
			"no-undef": "off", // 禁用未定义变量的检查
		},
	},

	// 忽略特定文件或目录
	{
		ignores: [
			"dist/",
			"node_modules/",
			"main.js",
			"styles.css",
			"main.css",
		],
	},
];
