import { ARTICLE_LINK_CLASS, sanitizeHref } from "@/lib/content/links";
import type { Article, ArticleStatus } from "@/lib/types";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalComposer, type InitialConfigType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, $createLinkNode, createLinkMatcherWithRegExp, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  PASTE_COMMAND,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ArticleEditorValue {
  id?: string;
  title: string;
  slug: string;
  description: string;
  author_name: string;
  status: ArticleStatus;
  content_html: string;
}

interface ArticleEditorProps {
  value: ArticleEditorValue;
  onChange: (value: ArticleEditorValue) => void;
  onSave: () => void;
  saving: boolean;
}

const URL_REGEXP = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEXP, (text) => sanitizeHref(text) || text),
];

function normalizeEditorHtml(input: string) {
  const fallback = "<p></p>";
  const source = (input || "").trim();
  if (!source) return fallback;

  if (typeof window === "undefined") {
    return source.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "<p></p>") || fallback;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="editor-root">${source}</div>`, "text/html");
  const root = doc.getElementById("editor-root");
  if (!root) return fallback;

  const blockTags = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE", "PRE"]);

  root.querySelectorAll("div").forEach((node) => {
    if (!(node instanceof HTMLDivElement)) return;
    const hasNestedBlocks = Array.from(node.children).some((child) => blockTags.has(child.tagName));
    if (hasNestedBlocks) return;

    const paragraph = doc.createElement("p");
    while (node.firstChild) {
      paragraph.appendChild(node.firstChild);
    }
    node.replaceWith(paragraph);
  });

  root.querySelectorAll("p").forEach((paragraph) => {
    const onlyEmptyContent = Array.from(paragraph.childNodes).every((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.textContent || "").replace(/\u00a0/g, " ").trim().length === 0;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        return (child as Element).tagName === "BR";
      }
      return false;
    });

    if (onlyEmptyContent) {
      paragraph.innerHTML = "";
    }
  });

  const result = root.innerHTML.trim();
  return result || fallback;
}

function ToolbarPlugin({ setLinkError }: { setLinkError: (value: string | null) => void }) {
  const [editor] = useLexicalComposerContext();

  const setBlock = useCallback(
    (block: "paragraph" | "h2" | "h3" | "quote") => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        if (block === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }

        if (block === "quote") {
          $setBlocksType(selection, () => $createQuoteNode());
          return;
        }

        $setBlocksType(selection, () => $createHeadingNode(block));
      });
    },
    [editor],
  );

  const insertCleanParagraph = useCallback(() => {
    editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createParagraphNode());
    });
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }, [editor]);

  const addLink = useCallback(() => {
    const raw = window.prompt("Вставьте ссылку (https://...)", "https://");
    if (raw === null) return;

    const href = sanitizeHref(raw.trim());
    if (!href) {
      setLinkError("Неверная ссылка. Используйте формат https://example.com");
      return;
    }

    let hasSelectedText = false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      hasSelectedText = $isRangeSelection(selection) && !selection.isCollapsed();
    });

    if (hasSelectedText) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        url: href,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      });
      setLinkError(null);
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const linkNode = $createLinkNode(href, {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      });
      linkNode.append($createTextNode(href));
      selection.insertNodes([linkNode, $createTextNode(" ")]);
    });

    setLinkError(null);
  }, [editor, setLinkError]);

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setBlock("h2")}>H2</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setBlock("h3")}>H3</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>Bold</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>Italic</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setBlock("quote")}>Цитата</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>• Список</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>1. Список</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}>Убрать список</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={insertCleanParagraph}>Новый абзац</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>Ссылка</button>
      <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}>Убрать ссылку</button>
    </div>
  );
}

function SmartPasteLinkPlugin({ setLinkError }: { setLinkError: (value: string | null) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false;

        const raw = event.clipboardData?.getData("text/plain").trim() || "";
        if (!raw || /\s/.test(raw)) return false;

        const href = sanitizeHref(raw);
        if (!href) return false;

        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const linkNode = $createLinkNode(href, {
            target: "_blank",
            rel: "noopener noreferrer nofollow",
          });
          linkNode.append($createTextNode(raw));
          selection.insertNodes([linkNode, $createTextNode(" ")]);
        });

        setLinkError(null);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, setLinkError]);

  return null;
}

function HtmlSyncPlugin({
  html,
  onHtmlChange,
}: {
  html: string;
  onHtmlChange: (nextHtml: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const lastHtmlRef = useRef(normalizeEditorHtml(html));

  useEffect(() => {
    const normalized = normalizeEditorHtml(html);
    if (normalized === lastHtmlRef.current) return;

    lastHtmlRef.current = normalized;
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const parser = new DOMParser();
      const dom = parser.parseFromString(normalized, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      if (nodes.length === 0) {
        root.append($createParagraphNode());
      } else {
        root.append(...nodes);
      }
    });
  }, [editor, html]);

  const handleChange = useCallback(
    (editorState: EditorState, lexicalEditor: LexicalEditor) => {
      editorState.read(() => {
        const generatedHtml = $generateHtmlFromNodes(lexicalEditor, null);
        const normalized = normalizeEditorHtml(generatedHtml);
        if (normalized === lastHtmlRef.current) return;

        lastHtmlRef.current = normalized;
        onHtmlChange(normalized);
      });
    },
    [onHtmlChange],
  );

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

export function mapArticleToEditor(article: Article): ArticleEditorValue {
  return {
    id: article.id,
    title: article.title || "",
    slug: article.slug || "",
    description: article.description || "",
    author_name: article.author_name || "",
    status: article.status,
    content_html: article.content_html || "",
  };
}

export function emptyEditorValue(): ArticleEditorValue {
  return {
    title: "",
    slug: "",
    description: "",
    author_name: "",
    status: "draft",
    content_html: "<p></p>",
  };
}

const editorTheme = {
  link: ARTICLE_LINK_CLASS,
  paragraph: "mb-3",
  quote: "border-l-4 border-[color:var(--border)] pl-4 italic text-[color:var(--muted)]",
  heading: {
    h2: "mt-5 mb-3 text-2xl font-bold text-[color:var(--text)]",
    h3: "mt-4 mb-2 text-xl font-semibold text-[color:var(--text)]",
  },
  list: {
    ul: "list-disc pl-6 mb-3",
    ol: "list-decimal pl-6 mb-3",
    listitem: "mb-1",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
  },
};

export default function ArticleEditor({ value, onChange, onSave, saving }: ArticleEditorProps) {
  const [linkError, setLinkError] = useState<string | null>(null);

  const updateField = (field: keyof ArticleEditorValue, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateHtml = useCallback(
    (nextHtml: string) => {
      if (nextHtml === value.content_html) return;
      onChange({ ...value, content_html: nextHtml });
    },
    [onChange, value],
  );

  const initialConfig = useMemo<InitialConfigType>(
    () => ({
      namespace: "unityone-admin-editor",
      onError: (error) => {
        throw error;
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
      theme: editorTheme,
      editorState: undefined,
    }),
    [],
  );

  return (
    <section className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-[color:var(--muted)]">Заголовок</span>
          <input value={value.title} onChange={(e) => updateField("title", e.target.value)} className="rounded-lg px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-[color:var(--muted)]">Slug</span>
          <input value={value.slug} onChange={(e) => updateField("slug", e.target.value)} className="rounded-lg px-3 py-2" placeholder="auto from title" />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="text-[color:var(--muted)]">Описание</span>
          <textarea value={value.description} onChange={(e) => updateField("description", e.target.value)} className="min-h-20 rounded-lg px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-[color:var(--muted)]">Автор</span>
          <input value={value.author_name} onChange={(e) => updateField("author_name", e.target.value)} className="rounded-lg px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-[color:var(--muted)]">Статус</span>
          <select value={value.status} onChange={(e) => updateField("status", e.target.value as ArticleStatus)} className="rounded-lg px-3 py-2">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
        <div className="md:col-span-2">
          {value.status === "draft" ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Сейчас это черновик. На странице архива отображаются только статьи со статусом `published`.
            </p>
          ) : (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Статус `published`: статья доступна на публичной странице.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] p-3">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin setLinkError={setLinkError} />
          <div className="min-h-[260px] rounded-lg border border-[color:var(--border)] p-3 text-[color:var(--text)]">
            <RichTextPlugin
              contentEditable={<ContentEditable className="min-h-[220px] outline-none" />}
              placeholder={<p className="pointer-events-none text-[color:var(--muted)]">Начните писать пост...</p>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
            <SmartPasteLinkPlugin setLinkError={setLinkError} />
            <HtmlSyncPlugin html={value.content_html} onHtmlChange={updateHtml} />
          </div>
        </LexicalComposer>
        {linkError && <p className="mt-2 text-xs text-red-600">{linkError}</p>}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onSave} disabled={saving} className="rounded-lg bg-[var(--sk-button-background)] px-4 py-2 text-sm text-white disabled:opacity-60">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </section>
  );
}
