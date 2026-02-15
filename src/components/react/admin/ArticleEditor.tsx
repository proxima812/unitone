import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from "react";
import { ARTICLE_LINK_CLASS, sanitizeHref } from "@/lib/content/links";
import { enhanceArticleLinksHtml } from "@/lib/content/sanitize";
import type { Article, ArticleStatus } from "@/lib/types";

interface ArticleEditorValue {
  id?: string;
  title: string;
  slug: string;
  description: string;
  author_name: string;
  status: ArticleStatus;
  content_html: string;
  published_at?: string;
}

interface ArticleEditorProps {
  value: ArticleEditorValue;
  onChange: (value: ArticleEditorValue) => void;
  onSave: () => void;
  saving: boolean;
}

function cmd(command: string, value?: string) {
  document.execCommand(command, false, value);
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
    published_at: article.published_at || "",
  };
}

export function emptyEditorValue(): ArticleEditorValue {
  return {
    title: "",
    slug: "",
    description: "",
    author_name: "",
    status: "draft",
    content_html: "",
    published_at: "",
  };
}

export default function ArticleEditor({ value, onChange, onSave, saving }: ArticleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value.content_html) {
      editorRef.current.innerHTML = value.content_html;
    }
  }, [value.content_html]);

  const previewHtml = useMemo(() => enhanceArticleLinksHtml(value.content_html), [value.content_html]);
  const previewDateISO = useMemo(() => {
    const fallback = new Date().toISOString();
    if (!value.published_at) return fallback;
    const parsed = new Date(value.published_at);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toISOString();
  }, [value.published_at]);
  const previewDateLabel = useMemo(
    () =>
      new Date(previewDateISO).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [previewDateISO],
  );
  const previewReadingMinutes = useMemo(() => {
    const words = value.content_html
      .replace(/<[^>]+>/g, " ")
      .match(/[\p{L}\p{N}]+/gu);
    return Math.max(1, Math.ceil((words?.length || 0) / 180));
  }, [value.content_html]);

  const updateField = (field: keyof ArticleEditorValue, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const createAnchor = (href: string, label: string) => {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer nofollow";
    anchor.className = ARTICLE_LINK_CLASS;
    anchor.textContent = label;
    return anchor;
  };

  const getEditorRange = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    return range;
  };

  const ensureSpaceAfterLink = (anchor: HTMLAnchorElement) => {
    const next = anchor.nextSibling;
    if (next?.nodeType === Node.TEXT_NODE) {
      const textNode = next as Text;
      if (!textNode.data.startsWith(" ")) {
        textNode.data = ` ${textNode.data}`;
      }
      return textNode;
    }
    const spacer = document.createTextNode(" ");
    anchor.parentNode?.insertBefore(spacer, next || null);
    return spacer;
  };

  const placeCaretIntoTextNodeEnd = (node: Text) => {
    const selection = window.getSelection();
    if (!selection) return;
    const nextRange = document.createRange();
    nextRange.setStart(node, node.data.length);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  };

  const moveCaretOutsideCurrentLink = () => {
    const editor = editorRef.current;
    const range = getEditorRange();
    if (!editor || !range || !range.collapsed) return;

    const anchor =
      (range.startContainer instanceof Element
        ? range.startContainer.closest("a")
        : range.startContainer.parentElement?.closest("a")) || null;
    if (!(anchor instanceof HTMLAnchorElement) || !editor.contains(anchor)) return;

    const tailRange = range.cloneRange();
    tailRange.selectNodeContents(anchor);
    tailRange.setStart(range.startContainer, range.startOffset);
    if (tailRange.toString().length > 0) return;

    const spacer = ensureSpaceAfterLink(anchor);
    placeCaretIntoTextNodeEnd(spacer);
  };

  const insertAnchorAtCaret = (href: string, label: string) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return false;

    let range = getEditorRange();
    if (!range) {
      editor.focus();
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const anchor = createAnchor(href, label);
    range.deleteContents();
    range.insertNode(anchor);

    const spacer = ensureSpaceAfterLink(anchor);
    placeCaretIntoTextNodeEnd(spacer);
    return true;
  };

  const normalizeEmptyParagraphs = (editor: HTMLDivElement) => {
    editor.querySelectorAll("p").forEach((paragraph) => {
      const hasOnlyEmptyContent = Array.from(paragraph.childNodes).every((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node.textContent || "").replace(/\u00a0/g, " ").trim();
          return text.length === 0;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          return (node as Element).tagName === "BR";
        }
        return false;
      });

      if (hasOnlyEmptyContent) {
        paragraph.innerHTML = "";
      }
    });
  };

  const normalizeDivParagraphs = (editor: HTMLDivElement) => {
    const blockTags = new Set([
      "P",
      "DIV",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "UL",
      "OL",
      "LI",
      "BLOCKQUOTE",
      "PRE",
    ]);

    editor.querySelectorAll("div").forEach((node) => {
      if (!(node instanceof HTMLDivElement)) return;
      const hasNestedBlocks = Array.from(node.children).some((child) => blockTags.has(child.tagName));
      if (hasNestedBlocks) return;

      const paragraph = document.createElement("p");
      while (node.firstChild) {
        paragraph.appendChild(node.firstChild);
      }
      node.replaceWith(paragraph);
    });
  };

  const normalizeEditorLinks = () => {
    const editor = editorRef.current;
    if (!editor) return;

    normalizeDivParagraphs(editor);
    normalizeEmptyParagraphs(editor);

    editor.querySelectorAll("a").forEach((anchor) => {
      const href = sanitizeHref(anchor.getAttribute("href") || "");
      if (!href) {
        anchor.replaceWith(document.createTextNode(anchor.textContent || ""));
        return;
      }
      anchor.setAttribute("href", href);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer nofollow");
      anchor.className = ARTICLE_LINK_CLASS;
    });

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE && current.parentElement?.closest("a") === null) {
        textNodes.push(current as Text);
      }
      current = walker.nextNode();
    }

    // ASCII URL pattern: keeps normal URLs clickable and avoids swallowing non-latin text after pasted links.
    const rawUrlPattern = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
    let invalidFound = false;

    textNodes.forEach((node) => {
      const text = node.nodeValue || "";
      rawUrlPattern.lastIndex = 0;
      if (!rawUrlPattern.test(text)) return;
      rawUrlPattern.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match = rawUrlPattern.exec(text);

      while (match) {
        const fullMatch = match[0];
        const trimmedMatch = fullMatch.replace(/[),.!?;:]+$/g, "");
        const trailing = fullMatch.slice(trimmedMatch.length);
        const href = sanitizeHref(trimmedMatch);
        const startIndex = match.index;

        if (startIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, startIndex)));
        }

        if (href) {
          fragment.appendChild(createAnchor(href, trimmedMatch));
        } else {
          fragment.appendChild(document.createTextNode(trimmedMatch));
          invalidFound = true;
        }

        if (trailing) {
          fragment.appendChild(document.createTextNode(trailing));
        }

        lastIndex = startIndex + fullMatch.length;
        match = rawUrlPattern.exec(text);
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.replaceWith(fragment);
    });

    if (invalidFound) {
      setLinkError("Часть ссылок не распознана. Используйте формат https://example.com");
    } else {
      setLinkError(null);
    }

    moveCaretOutsideCurrentLink();
  };

  const updateEditorHtml = () => {
    normalizeEditorLinks();
    onChange({ ...value, content_html: editorRef.current?.innerHTML || "" });
  };

  const applyCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    cmd(command, commandValue);
    updateEditorHtml();
  };

  const insertLinkFromPrompt = () => {
    const input = window.prompt("Вставьте ссылку (https://...)", "https://");
    if (input === null) return;

    const href = sanitizeHref(input.trim());
    if (!href) {
      setLinkError("Неверная ссылка. Используйте формат https://example.com");
      return;
    }

    const range = getEditorRange();
    if (range && !range.collapsed) {
      applyCommand("createLink", href);
      return;
    }

    insertAnchorAtCaret(href, href);
    setLinkError(null);
    onChange({ ...value, content_html: editorRef.current?.innerHTML || "" });
  };

  const insertCleanParagraph = () => {
    editorRef.current?.focus();
    cmd("insertParagraph");
    cmd("removeFormat");
    cmd("unlink");
    updateEditorHtml();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text/plain").trim();
    const href = sanitizeHref(pasted);
    if (!href) return;
    if (/\s/.test(pasted)) return;

    event.preventDefault();
    insertAnchorAtCaret(href, pasted);
    setLinkError(null);
    onChange({ ...value, content_html: editorRef.current?.innerHTML || "" });
  };

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
        <div className="mb-2 flex flex-wrap gap-2">
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("formatBlock", "H2")}>H2</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("formatBlock", "H3")}>H3</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("bold")}>Bold</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("italic")}>Italic</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={insertCleanParagraph}>Новый абзац</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={insertLinkFromPrompt}>Ссылка</button>
          <button type="button" className="px-2 py-1 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("unlink")}>Убрать ссылку</button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          onInput={updateEditorHtml}
          className="min-h-[260px] rounded-lg border border-[color:var(--border)] p-3 text-[color:var(--text)]"
        />
        {linkError && <p className="mt-2 text-xs text-red-600">{linkError}</p>}
      </div>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
        <p className="mb-3 text-sm text-[color:var(--muted)]">Предпросмотр поста (как на сайте)</p>
        <header className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 md:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
            <time dateTime={previewDateISO}>{previewDateLabel}</time>
            <span className="rounded-full border border-[color:var(--border)] px-2 py-1">
              {previewReadingMinutes} мин чтения
            </span>
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
            {value.title?.trim() || "Заголовок поста"}
          </h1>
          <p className="mt-3 text-[color:var(--muted)]">
            {value.description?.trim() || "Краткое описание поста"}
          </p>
        </header>
        <section
          className="my-prose article-rich-content !mx-0 !mt-5 !max-w-none !p-5 md:!p-8"
          dangerouslySetInnerHTML={{ __html: previewHtml || "<p></p>" }}
        />
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={onSave} disabled={saving} className="rounded-lg bg-[var(--sk-button-background)] px-4 py-2 text-sm text-white disabled:opacity-60">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </section>
  );
}
