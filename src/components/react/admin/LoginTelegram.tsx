import { env } from "@/lib/env";
import type { TelegramVerifyRequest } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramVerifyRequest) => void;
  }
}

interface LoginTelegramProps {
  onAuthenticated: () => void;
}

export default function LoginTelegram({ onAuthenticated }: LoginTelegramProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const botUsername = useMemo(
    () => (env.telegramBotUsername || "").trim().replace(/^@+/, "").replace(/\s+/g, ""),
    [],
  );

  useEffect(() => {
    if (!rootRef.current || !botUsername) return;

    window.onTelegramAuth = async (user: TelegramVerifyRequest) => {
      setError(null);
      setLoading(true);
      try {
        const response = await fetch("/api/auth/telegram/verify", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(user),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Telegram auth failed");
        }

        onAuthenticated();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Telegram auth failed");
      } finally {
        setLoading(false);
      }
    };

    rootRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    rootRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, onAuthenticated]);

  if (!botUsername) {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-red-600">
        Укажите `PUBLIC_TELEGRAM_BOT_USERNAME` в `.env`, чтобы включить вход через Telegram.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
      <h2 className="text-xl font-semibold text-[color:var(--text)]">Вход в админ панель</h2>
      <p className="mt-2 text-sm text-[color:var(--muted)]">
        Авторизация доступна только пользователям из whitelist. Напишите мне, чтобы попасть в белый список <a href="https://t.me/legion_free" target="_blank" className="text-blue-500 underline underline-offset-4">t.me/legion_free</a>
      </p>
      <div className="mt-4" ref={rootRef} />
      {loading && <p className="mt-3 text-sm text-[color:var(--muted)]">Проверяем аккаунт...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
