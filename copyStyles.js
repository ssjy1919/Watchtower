import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mainCssPath = resolve(__dirname, 'main.css');
const stylesCssPath = resolve(__dirname, 'styles.css');

try {
    // 读取 main.css 文件内容
    const data = await readFile(mainCssPath, 'utf8');
    // 将内容写入 styles.css
    await writeFile(stylesCssPath, data, 'utf8');
    // console.log('styles.css has been updated with the contents of main.css');
} catch (err) {
    console.error('Error processing CSS files:', err);
}