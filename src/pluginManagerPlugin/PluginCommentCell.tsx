import { useEffect, useRef } from "react";
import { MarkdownRenderer, Notice } from "obsidian";
import { PluginManager } from "../types";
import WatchtowerPlugin from "../main";

interface Props {
    plugin: WatchtowerPlugin;
    Iplugin: PluginManager;
    editing: boolean;
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    onEdit: () => void;
    onBlur: () => void;
}

const PluginCommentCell: React.FC<Props> = ({
    plugin, Iplugin, editing, value, placeholder, onChange, onEdit, onBlur
}) => {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editing && divRef.current) {
            divRef.current.innerHTML = "";
            MarkdownRenderer.render(
                plugin.app,
                value === "" ? placeholder : value,
                divRef.current,
                "",
                plugin
            ).then(() => {
                divRef.current?.querySelectorAll('a.internal-link').forEach(a => {
                    a.addEventListener('click', async (evt) => {
                        evt.stopPropagation();
                        const href = a.getAttribute('href') as string;
                        // 获取所有 md 文件
                        const files = plugin.app.vault.getMarkdownFiles();
                        // 统计匹配的文件
                        const matches = files.filter(f => {
                            // 去掉 .md 后缀再比对，只采用  .md 前面的文件路径进行匹配
                            const filePath = f.path.replace(/\.md$/, '');
                            return filePath === href || f.name.replace(/\.md$/, '') === href;
                        });
                        if (matches.length > 1) {
                            new Notice(`有多个名为 "${href}" 的笔记，请指定完整路径`);
                        } if (matches.length === 0)
                            new Notice(`未找到名为 "${href}" 的笔记`);
                        await plugin.app.workspace.openLinkText(href, '', false);
                    });
                });
            });
        }
    }, [editing, value, placeholder, plugin, Iplugin]);
    if (editing) {
        return (
            <textarea
                value={value}
                placeholder={placeholder}
                rows={2}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                autoFocus
            />
        );
    }
    return (
        <div
            className="markdown-rendered"
            ref={divRef}
            onClick={e => {
                if (!(e.target instanceof HTMLElement && e.target.closest('a'))) {
                    onEdit();
                }
            }}
        />
    );
};

export default PluginCommentCell;
