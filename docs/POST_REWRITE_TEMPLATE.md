# Post Rewrite Template

## Input
- `title`
- `description` (optional)
- `tags` (optional)
- `author` (must match one profile in `docs/AUTHOR_VOICE_GUIDE.md`)
- `relatedPosts` (optional, список `slug` похожих постов: без `/archive/` и без `.mdx`)

## Output Structure
1. Intro paragraph in author voice.
2. 2-4 short sections with `##` headings.
3. One practical list (3 points).
4. Closing paragraph in author voice + короткий призыв продолжать путь по шагам до 12-го.

## Hard Rules
- Keep language Russian.
- Keep topic aligned with title and description.
- Respect author voice constraints strictly.
- For `SamGold`: exactly 4 emojis + 2-4 mistakes.
- For `yuliaM`: 8-14 emojis, no mistakes.
- For `Svetlana`: lowercase sentence start after period exactly 4 times + mandatory ending line.

## Safety
- No toxicity, insults, or illegal guidance.
- No fabricated medical guarantees.

# POST_REWRITE_TEMPLATE v.2

Задача: переписать пост под заданный авторский голос, сохранив смысл и факты, но повысив читабельность, “живость” и вариативность структуры.

## INPUT

author: {Klia78 | SamGold | just_green1 | Xima | yuliaM | Svetlana}
language: ru
tone_hint: (optional, 1 строка)
audience: (кто читает)
goal: (что читатель должен понять/сделать)
length: {short | medium | long}

source_post: |
  (оригинальный текст)

facts_to_keep: (список 3–7 фактов/терминов/цифр, нельзя менять)
forbidden: (optional: слова/темы, которые нельзя упоминать)
cta: (optional: призыв в конце — 1 строка)

## OUTPUT REQUIREMENTS (Hard)

1) Не добавлять новые факты. Только переформулировать и перестроить.
2) Markdown формат.
3) 2–4 секции с H2 заголовками (##).
4) Обязателен один практический список ровно из 3 пунктов (bullet или numbered).
5) Есть intro paragraph (до первого ##) и closing paragraph (после последнего блока).
6) Соблюдать правила автора из AUTHOR_VOICE_GUIDE.md (эмодзи/подпись/особые ограничения).

## QUALITY RULES (Soft)

- Меняем ритм: чередуем короткие/длинные предложения согласно автору.
- Убираем общие штампы, “канцелярит”, объяснения ради объяснений.
- Пишем конкретно: меньше “процессов”, больше “что делать/что будет”.
- Минимизируем повтор слов в соседних предложениях.
- Не делать одинаковый паттерн секций в каждом посте — выбираем каркас.

---

## CARCASSES (выбери один и следуй)

### Каркас A — “Классика”
Intro  
## Section 1 (ключевая идея)  
## Section 2 (разбор/механика)  
(опционально) ## Section 3 (ошибка/нюанс)  
Practical list (3 points)  
Closing

### Каркас B — “Контекст + мини-FAQ”
Intro  
Context block (2–3 строки, без заголовка)  
## Section 1  
## Section 2  
Practical list (3 points)  
FAQ (2 вопроса, коротко, без заголовков или с "Q:"/"A:")  
Closing

### Каркас C — “Миф → реальность”
Hook line (1–2 строки) + Intro (можно слить)  
## Миф (что обычно думают)  
## Реальность (как работает на деле)  
Practical list (3 points)  
Closing

### Каркас D — “История → чеклист”
Mini-story (3–4 строки) как intro (без выдумки)  
## Что произошло / почему важно  
## Что делать дальше  
Practical list (3 points)  
Closing

---

## SECTION CONSTRUCTION RULES

- Каждый H2 заголовок: 3–8 слов, без воды, без эмодзи.
- Внутри секции: 2–5 абзацев, каждый 1–3 предложения (по автору).
- Practical list: не “абстракции”, а действия или проверяемые пункты.
- Closing: 2–4 строки, итоги + CTA (если задан), без клише.

---

## AUTHOR-SPECIFIC HARD RULES (минимальный чеклист)

- Klia78: эмодзи = 0
- SamGold: эмодзи = 4, “человеческих” ошибок 2–4 (не в фактах/цифрах/заголовках)
- just_green1: эмодзи = 0
- Xima: эмодзи 0–3
- yuliaM: эмодзи 8–14, не 3 подряд, не в заголовках, ! максимум 2
- Svetlana: эмодзи = 0, lowercase-after-period ровно 4 раза, финал:
  "Писала Светлана. Спасибо за прочтение!"

---

## FINAL OUTPUT FORMAT (примерный скелет)

(Intro paragraph)

## (H2 #1)
(текст)

## (H2 #2)
(текст)

(опционально) ## (H2 #3)
(текст)

(Практический список — ровно 3 пункта)
- ...
- ...
- ...

(Closing paragraph)
(если author=Svetlana — добавить обязательную подпись в самом конце)
