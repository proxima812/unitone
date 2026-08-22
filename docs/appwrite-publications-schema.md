# Appwrite: коллекция пользовательских публикаций

Этот контракт описывает коллекцию `publications` для Astro SSR-приложения Unity One. В ней хранятся черновики, записи на модерации и опубликованные пользовательские материалы.

## Переменные развёртывания

Для ID коллекции публикаций поддерживаются два взаимозаменяемых имени:

- `APPWRITE_PUBLICATIONS_COLLECTION_ID` — предпочтительное имя;
- `PUBLICATIONS_COLLECTION_ID` — алиас для Appwrite Sites.

Задайте одно из них. При наличии обоих приложение использует `APPWRITE_PUBLICATIONS_COLLECTION_ID`. Общие Appwrite-настройки также принимают `APPWRITE_ENDPOINT` / `API_ENDPOINT`, `APPWRITE_PROJECT_ID` / `PROJECT_ID`, `APPWRITE_API_KEY` / `API_SECRET` и `APPWRITE_DATABASE_ID` / `DATABASE_ID`.

Для модерации задаётся список числовых ID через запятую, например:

```bash
ADMIN_TELEGRAM_IDS=5522146122
```

Пустое или отсутствующее `ADMIN_TELEGRAM_IDS` не предоставляет права администратора. Это конфигурация развёртывания: ID не должен добавляться в код приложения.

## Атрибуты `publications`

Создайте строковые атрибуты со следующими минимальными размерами. Значения дат хранятся строками ISO 8601, а пустая строка означает, что соответствующее событие ещё не произошло.

| Атрибут | Тип Appwrite | Размер/ограничение | Назначение |
| --- | --- | --- | --- |
| `type` | string | 16 | Один из `material`, `post`, `tool`, `experience`. |
| `status` | string | 16 | `draft`, `review`, `published` или `rejected`. |
| `title` | string | 120 | Обязательный заголовок. |
| `summary` | string | 400 | Обязательное краткое описание. |
| `content` | string | 30000 | Обязательный текст в ограниченном Markdown. |
| `category` | string | 80 | Только для `post`; иначе пустая строка. |
| `tags` | string array | до 8 элементов по 40 | Только для `post`; иначе пустой массив. |
| `authorTelegramId` | string | 64 | Внутренний Telegram ID автора. |
| `authorName` | string | 256 | Отображаемое имя автора. |
| `authorUsername` | string | 128 | Username автора без дополнительной обработки. |
| `authorPhotoUrl` | string | 2048 | URL фотографии Telegram. |
| `moderationNote` | string | 1000 | Обязательный комментарий при `rejected`; иначе пустая строка. |
| `createdAt` | string | 32 | Время создания. |
| `updatedAt` | string | 32 | Время последнего изменения. |
| `submittedAt` | string | 32 | Время отправки на модерацию, либо пустая строка. |
| `publishedAt` | string | 32 | Время публикации, либо пустая строка. |

Все строковые атрибуты должны допускать пустую строку там, где это указано выше; массив `tags` должен быть создан как массив строк. Ограничения ввода дополнительно применяются сервером: `title`, `summary` и `content` обязательны, теги нормализуются и дедуплицируются без учёта регистра.

## Индексы

Создайте следующие ключевые индексы:

| ID индекса | Тип | Атрибуты | Назначение |
| --- | --- | --- | --- |
| `type_status_publishedAt` | key | `type`, `status`, `publishedAt` | Публичные каталоги по типу и статусу, новые сверху. |
| `authorTelegramId_updatedAt` | key | `authorTelegramId`, `updatedAt` | Список собственных публикаций автора. |

Для фильтров постов добавьте индексы `category` и `tags`, если их поддерживает версия Appwrite. Очередь модерации использует `status` и сортировку по `submittedAt`; при заметном объёме данных добавьте соответствующий индекс как операционное улучшение.

## Профили и доступ

В существующей коллекции Telegram-профилей должны быть строковые поля `createdAt` и `updatedAt`: первое сохраняет время первой регистрации, второе — последней успешной авторизации.

Права самой коллекции `publications` остаются server-only. Клиент не обращается к Appwrite напрямую: сервер проверяет Telegram `initData` и использует API key для всех чтений и записей. Не выдавайте публичные или пользовательские права на документы только ради каталогов или редактора.

## Маршруты и рабочие роли

- Публичные страницы: `/app/materials/`, `/app/posts/`, `/app/tools/`, `/app/experience/` и страницы деталей с ID. Они показывают только `published`.
- Автор: `/app/create/` выбирает тип; `/app/create/[type]/` создаёт или редактирует собственный `draft` либо `rejected`. После отправки статус становится `review`; опубликованную или находящуюся на проверке запись редактировать нельзя. `/app/profile/` показывает Telegram-профиль и все собственные записи.
- Модератор: `/app/admin/` доступен только ID из `ADMIN_TELEGRAM_IDS`. Он получает очередь `review`, публикует запись или возвращает её в `rejected` с комментарием длиной от 1 до 1000 символов. После доработки автор снова отправляет запись на проверку.

Серверные API-маршруты повторяют эти границы: публичный `GET /api/publications`, авторские `POST /api/publications`, `PATCH /api/publications/[id]`, `POST /api/publications/[id]/submit`, `GET|POST /api/profile/publications`, и закрытые `GET|POST /api/admin/publications`, `POST /api/admin/publications/[id]/publish`, `POST /api/admin/publications/[id]/reject`, `GET|POST /api/admin/authors/[telegramId]`.
