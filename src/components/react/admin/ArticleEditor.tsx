import { useEffect, useMemo, useRef, useState } from "react";
import { buildEditorLinkMeta, sanitizeHref } from "@/lib/content/links";
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

  const updateField = (field: keyof ArticleEditorValue, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const updateEditorHtml = () => {
    onChange({ ...value, content_html: editorRef.current?.innerHTML || "" });
  };

  const insertLink = () => {
    const rawHref = window.prompt("Вставьте ссылку");
    if (!rawHref) return;

    const href = sanitizeHref(rawHref);
    if (!href) {
      setLinkError("Невалидная ссылка. Используйте http/https/mailto/tel или относительный URL.");
      return;
    }

    const meta = buildEditorLinkMeta(href);
    setLinkError(null);

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      cmd("createLink", href);
    } else {
      cmd("insertHTML", `<a href="${meta.href}">${meta.displayText}</a>`);
    }

    updateEditorHtml();
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
      </div>

      <div className="rounded-xl border border-[color:var(--border)] p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          <button type="button" className="px-2 py-1 text-sm" onClick={() => cmd("formatBlock", "H2")}>H2</button>
          <button type="button" className="px-2 py-1 text-sm" onClick={() => cmd("formatBlock", "H3")}>H3</button>
          <button type="button" className="px-2 py-1 text-sm" onClick={() => cmd("bold")}>Bold</button>
          <button type="button" className="px-2 py-1 text-sm" onClick={() => cmd("italic")}>Italic</button>
          <button type="button" className="px-2 py-1 text-sm" onClick={insertLink}>Insert Link</button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateEditorHtml}
          className="min-h-[260px] rounded-lg border border-[color:var(--border)] p-3 text-[color:var(--text)]"
        />
        {linkError && <p className="mt-2 text-xs text-red-600">{linkError}</p>}
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--muted)]">Preview</p>
        <div className="my-prose !mx-0 !max-w-none !p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onSave} disabled={saving} className="rounded-lg bg-[var(--sk-button-background)] px-4 py-2 text-sm text-white disabled:opacity-60">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </section>
  );
}
