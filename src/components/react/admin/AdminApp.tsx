import { useMemo, useState } from "react";
import useSWR from "swr";
import type { Article } from "@/lib/types";
import LoginTelegram from "@/components/react/admin/LoginTelegram";
import ArticleList from "@/components/react/admin/ArticleList";
import ArticleEditor, { emptyEditorValue, mapArticleToEditor } from "@/components/react/admin/ArticleEditor";

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "cache-control": "no-store",
      pragma: "no-cache",
    },
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Failed to fetch ${url}`);
  }
  return response.json();
};

export default function AdminApp() {
  const [selected, setSelected] = useState<Article | null>(null);
  const [editor, setEditor] = useState(emptyEditorValue());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: me, mutate: mutateMe, isLoading: meLoading } = useSWR("/api/auth/me", fetchJson, { dedupingInterval: 0 });
  const { data, mutate, isLoading } = useSWR(me ? "/api/admin/articles" : null, fetchJson, {
    dedupingInterval: 0,
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  const csrfToken = me?.csrfToken as string | undefined;
  const items = useMemo(() => (data?.items || []) as Article[], [data]);

  const onSelect = (article: Article) => {
    setNotice(null);
    setSelected(article);
    setEditor(mapArticleToEditor(article));
  };

  const onCreate = () => {
    setNotice(null);
    setSelected(null);
    setEditor(emptyEditorValue());
  };

  const save = async () => {
    if (!csrfToken) return;
    setSaving(true);
    setNotice(null);
    try {
      const isUpdate = Boolean(editor.id);
      const endpoint = isUpdate ? `/api/admin/articles/${editor.id}` : "/api/admin/articles";
      const method = isUpdate ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
          "cache-control": "no-store",
          pragma: "no-cache",
        },
        body: JSON.stringify(editor),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save article");
      }

      const payload = await response.json();
      if (payload.item) {
        await mutate((current: { items?: Article[] } | undefined) => {
          const list = current?.items || [];
          const incoming = payload.item as Article;
          if (isUpdate) {
            return { items: list.map((entry) => (entry.id === incoming.id ? incoming : entry)) };
          }
          return { items: [incoming, ...list] };
        }, false);
        setSelected(payload.item);
        setEditor(mapArticleToEditor(payload.item));
      }
      await mutate();
      setNotice({
        type: "success",
        message: isUpdate ? "Пост успешно обновлен." : "Пост успешно создан и добавлен в список.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save article",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (article: Article) => {
    if (!csrfToken) return;
    if (!window.confirm(`Удалить статью \"${article.title}\"?`)) return;
    setNotice(null);

    const response = await fetch(`/api/admin/articles/${article.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "x-csrf-token": csrfToken,
        "cache-control": "no-store",
        pragma: "no-cache",
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setNotice({
        type: "error",
        message: payload.error || "Failed to delete article",
      });
      return;
    }

    await mutate((current: { items?: Article[] } | undefined) => {
      const list = current?.items || [];
      return { items: list.filter((entry) => entry.id !== article.id) };
    }, false);

    if (selected?.id === article.id) {
      setSelected(null);
      setEditor(emptyEditorValue());
    }
    await mutate();
    setNotice({
      type: "success",
      message: "Пост удален.",
    });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSelected(null);
    setEditor(emptyEditorValue());
    await mutateMe();
  };

  if (meLoading) {
    return <p className="text-sm text-[color:var(--muted)]">Проверяем сессию...</p>;
  }

  if (!me) {
    return <LoginTelegram onAuthenticated={() => mutateMe()} />;
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Вошли как</p>
          <p className="text-sm font-semibold text-[color:var(--text)]">{me.username || `ID ${me.telegramId}`}</p>
        </div>
        <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={logout}>
          Выйти
        </button>
      </div>

      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ArticleList
          items={items}
          selectedId={selected?.id}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={remove}
        />

        {isLoading ? (
          <p className="text-sm text-[color:var(--muted)]">Загрузка статей...</p>
        ) : (
          <ArticleEditor value={editor} onChange={setEditor} onSave={save} saving={saving} />
        )}
      </div>
    </div>
  );
}
