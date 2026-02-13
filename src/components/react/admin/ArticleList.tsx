import type { Article } from "@/lib/types";

interface ArticleListProps {
  items: Article[];
  selectedId?: string;
  onSelect: (article: Article) => void;
  onCreate: () => void;
  onDelete: (article: Article) => void;
}

export default function ArticleList({ items, selectedId, onSelect, onCreate, onDelete }: ArticleListProps) {
  return (
    <aside className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[color:var(--text)]">Статьи</h2>
        <button type="button" className="rounded-lg bg-[var(--sk-button-background)] px-3 py-1.5 text-sm text-white" onClick={onCreate}>
          Новый пост
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border p-3 ${selectedId === item.id ? "border-[color:var(--primary)]" : "border-[color:var(--border)]"}`}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="w-full text-left"
            >
              <p className="line-clamp-2 text-sm font-semibold text-[color:var(--text)]">{item.title}</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">/{item.slug}</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {item.status === "published" ? "Опубликовано" : "Черновик"}
              </p>
            </button>
            <button
              type="button"
              className="mt-2 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700"
              onClick={() => onDelete(item)}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
