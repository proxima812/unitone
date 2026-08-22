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

## Appwrite и Telegram

Форма `/app/new-community/` проверяет `Telegram.WebApp.initData` на сервере и сохраняет профиль Telegram вместе с предложенной карточкой сообщества в Appwrite через REST API.

Приложение размещается в Appwrite Sites как Astro SSR (`@astrojs/node`). Текущий адрес: `https://unityone.appwrite.network`.

Переменные окружения:

```bash
TELEGRAM_BOT_TOKEN=
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_TELEGRAM_PROFILES_COLLECTION_ID=
APPWRITE_COMMUNITY_PROPOSALS_COLLECTION_ID=
APPWRITE_PUBLICATIONS_COLLECTION_ID=
ADMIN_TELEGRAM_IDS=5522146122
```

Для совместимости также поддерживаются старые имена `API_ENDPOINT`, `PROJECT_ID`, `API_SECRET` и `DATABASE_ID`. Коллекция профилей принимает также `APPWRITE_PROFILES_COLLECTION_ID` и `TELEGRAM_PROFILES_COLLECTION_ID`, предложений сообществ — `COMMUNITY_PROPOSALS_COLLECTION_ID`, а публикаций — `PUBLICATIONS_COLLECTION_ID`. Для каждой настройки используйте только одно из перечисленных имён: первым применяется вариант с `APPWRITE_`.

В Appwrite Sites используются runtime-переменные `API_ENDPOINT`, `PROJECT_ID`, `API_SECRET`, `DATABASE_ID`, `TELEGRAM_PROFILES_COLLECTION_ID`, `COMMUNITY_PROPOSALS_COLLECTION_ID`, `PUBLICATIONS_COLLECTION_ID`, `ADMIN_TELEGRAM_IDS` и `TELEGRAM_BOT_TOKEN`. Префикс `APPWRITE_` там зарезервирован платформой. Для токена также поддерживается локальный алиас `BOT_TOKEN`.

`ADMIN_TELEGRAM_IDS` — список числовых Telegram ID через запятую; пустое значение не даёт прав никому. Значение `ADMIN_TELEGRAM_IDS=5522146122` — пример значения для текущего развёртывания, а не значение, зашитое в приложении.

Минимальные поля коллекции профилей:

- `telegramId`, `firstName`, `lastName`, `username`, `languageCode`, `photoUrl`, `source` — string
- `isPremium` — boolean
- `createdAt`, `updatedAt` — string

Минимальные поля коллекции предложений:

- `type`, `status`, `title`, `description`, `category`, `since`, `website`, `finderUrl`, `notes`, `telegramId`, `telegramUsername`, `telegramFirstName`, `telegramLastName`, `createdAt`, `updatedAt`, `source` — string

Подробная схема и индексы коллекции пользовательских публикаций: [docs/appwrite-publications-schema.md](docs/appwrite-publications-schema.md).

## Публикации пользователей

Публичные каталоги доступны по адресам `/app/materials/`, `/app/posts/`, `/app/tools/` и `/app/experience/`; каждая запись открывается по тому же пути с её ID. В каталог попадают только записи со статусом `published`.

Автор начинает с `/app/create/`, выбирает тип и сохраняет черновик либо отправляет его на модерацию. Редактор доступен только для собственного `draft` или `rejected`; отправленные на проверку и опубликованные записи редактировать нельзя. В `/app/profile/` отображаются Telegram-профиль и собственные публикации.

Страница `/app/admin/` и маршруты модерации доступны только Telegram ID из `ADMIN_TELEGRAM_IDS`: модератор просматривает очередь, публикует запись либо возвращает её с обязательным комментарием. Проверка Telegram `initData`, работа с Appwrite и все операции модерации выполняются на сервере.
