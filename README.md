# Unity One — Telegram Mini App

Проект снова открыт и развивается как мини-приложение для Telegram.

Unity One помогает быстро найти материалы по программе 12 шагов: сообщества, методы прохождения и личную подборку избранного. Основной интерфейс приложения находится в `/app/`.

## Стек

- Astro
- Tailwind CSS
- MDX-контент
- Bun

## Команды

```bash
bun install
bun run dev
bun run check
bun test
bun run build
```

## Структура

- `src/pages/app/` — страницы Telegram Mini App
- `src/components/catalog/` — интерфейс каталога
- `src/content/communities/` — карточки сообществ
- `src/content/methods/` — карточки методов
- `src/lib/catalog/` — индексация, поиск и состояние каталога
