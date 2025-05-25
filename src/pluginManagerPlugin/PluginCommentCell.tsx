import { useEffect, useRef } from "react";
import { MarkdownRenderer } from "obsidian";
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
                    a.addEventListener('click', (evt) => {
                        evt.stopPropagation();
                        plugin.app.workspace.openLinkText(a.getAttribute('href') as string, '', false);
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
            style={{ minWidth: 120, cursor: "pointer" }}
            onClick={e => {
                if (!(e.target instanceof HTMLElement && e.target.closest('a'))) {
                    onEdit();
                }
            }}
        />
    );
};

export default PluginCommentCell;