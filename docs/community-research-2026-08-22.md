# Deep research сообществ — batch 2026-08-22

## Dataset before

- Карточек: 70.
- Категории: психическое здоровье — 18; поддержка близких — 10; наркотические зависимости — 9; общие зависимости — 9; социальные проблемы — 5; другое — 5; алкоголь — 4; пищевое поведение — 4; финансы — 4; творческие зависимости — 2.
- Описаний короче 100 символов: 62.
- Карточек без production-поля `sources`: 70.

## Research process

Выполнены четыре независимых read-only трека: вещества; поведенческие зависимости; семьи, отношения и эмоции; multilingual graph traversal. Каждый трек проверял текущие 70 названий, official About/History/Steps, национальные отделения, независимые публикации и признаки локальной группы или дубля. Зафиксировано 67 candidate observations; после объединения повторов между треками и уже существующими карточками — 41 уникальная entity или спорная entity-гипотеза.

### Coverage matrix

| Тип | Было | Слабые описания | Без sources | Новые карточки | Обновлено |
| --- | ---: | ---: | ---: | ---: | ---: |
| Алкоголь | 4 | 4 | 4 | 0 | 1 |
| Наркотики и вещества | 9 | 8 | 9 | 3 | 8 |
| Еда и тело | 4 | 4 | 4 | 4 | 3 |
| Азартные игры и финансы | 5 | 5 | 5 | 2 | 3 |
| Секс, любовь и отношения | 5 | 5 | 5 | 4 | 5 |
| Семьи и близкие | 10 | 9 | 10 | 3 | 5 |
| Работа, долги и недозарабатывание | 4 | 4 | 4 | 1 | 3 |
| Эмоции и психическое здоровье | 18 | 18 | 18 | 1 | 5 |
| Социальные и цифровые трудности | 10 | 9 | 10 | 1 | 5 |
| Общие и многопрофильные | 5 | 4 | 5 | 1 | 3 |

## Added — 16

| ID | Сообщество | Категория | Sources |
| --- | --- | --- | ---: |
| `mara` | Medication-Assisted Recovery Anonymous | Наркотические зависимости | 2 |
| `drug-addicts-anonymous` | Drug Addicts Anonymous | Наркотические зависимости | 2 |
| `opiates-anonymous` | Opiates Anonymous | Наркотические зависимости | 2 |
| `psychedelics-in-recovery` | Psychedelics in Recovery | Общие зависимости | 2 |
| `food-addicts-anonymous` | Food Addicts Anonymous | Проблемы с пищей | 2 |
| `greysheeters-anonymous` | GreySheeters Anonymous | Проблемы с пищей | 2 |
| `anorexics-bulimics-anonymous` | Anorexics and Bulimics Anonymous | Проблемы с пищей | 2 |
| `addictive-eaters-anonymous` | Addictive Eaters Anonymous | Проблемы с пищей | 2 |
| `sex-addicts-anonymous` | Sex Addicts Anonymous | Психические расстройства | 2 |
| `recovering-couples-anonymous` | Recovering Couples Anonymous | Психические расстройства | 2 |
| `cosa` | COSA | Поддержка близких | 2 |
| `s-anon` | S-Anon | Поддержка близких | 2 |
| `gam-anon` | Gam-Anon | Поддержка близких | 2 |
| `violence-anonymous` | Violence Anonymous | Социальные проблемы | 2 |
| `co-anon` | Co-Anon | Поддержка близких | 2 |
| `spenders-anonymous` | Spenders Anonymous | Финансовые трудности | 2 |

## Updated

Подтверждёнными official sources исправлены OA, FA, EDA, ITAA, GAA/CGAA, MAA, CLA, PA, SA, SCA, SRA, SLAA, DA, UA, WA, CDA, HA, MA, CMA, CA, NicA, Pills Anonymous, AAA, DRA, EA, SIA, CoDA, Nar-Anon, Families Anonymous, AA и NA. Ключевые entity-resolution исправления:

- OA основано в 1960, а не в 1980.
- Food Addicts in Recovery Anonymous стало самостоятельной fellowship в 1998; прежняя карточка смешивала его с датой OA.
- `anonimnye-lyubovno-zavisimye` дублировала SLAA.
- Business Debtors Anonymous — формат внутри Debtors Anonymous, а не отдельная fellowship.
- GAA и прежнее название CGAA — одна entity.
- DRA — Dual Recovery Anonymous, 1989.
- AA и NA приведены к терминологии локального глоссария: разные языки алкоголизма и зависимости, взаимопомощь вместо медицинского лечения.

После batch все 60 production-карточек имеют `sources`: 38 карточек с одним источником, 22 — с двумя. Описаний короче 100 символов осталось 19; они не переписывались без отдельного доказательного основания.

## Rejected / removed existing — 26

| Причина | ID |
| --- | --- |
| Формат или локальная группа AA | `aa-dlya-beremennyh-mam`, `b2b-back-to-basic-aa`, `bbss-aa`, `anonimnye-agnostiki-i-ateisty` |
| Дубль или подформат существующей fellowship | `anonimnye-biznes-dolzhniki`, `anonimnye-lyubovno-zavisimye`, `anonimnye-semi-himicheski-zavisimyh`, `i-anon` |
| Не 12-step fellowship | `lifering`, `pa`, `refuge-recovery`, `rfr`, `smart-recovery`, `the-phoenix` |
| Нет достаточного primary evidence самостоятельной fellowship | `abused-anonymous`, `anonimnye-adrenalinovye-narkomany`, `anonimnye-bezrabotnye`, `anonimnye-domosedy`, `anonimnye-nedouchki`, `anonimnye-ongoliki`, `anonimnye-trihotillomany`, `anonimnye-zamykayushchie`, `anonimnyh-dejdremerov`, `avet`, `azot-anonimnye-zavisimye-ot-telesnyh-zazhimov` |
| Искажённая карточка заменена доказанной entity ABA | `anonimnye-kontrzavisimye-anoreksiki` |

### Rejected or held discoveries

| Candidate | Decision | Reason |
| --- | --- | --- |
| Fentanyl Anonymous | hold | Текущий сайт не подтверждает действующую 12-step модель достаточно ясно. |
| Methadone Anonymous | historical hold | Нет подтверждённого текущего service body; не смешивать с MARA. |
| COSLAA | hold | Secondary evidence есть, текущий primary service body не найден. |
| Grief / Grievers Anonymous | reject/hold | Нет достаточного текущего primary evidence самостоятельной fellowship. |
| Good Grief Network | reject | Использует 10 шагов, не входит в scope. |
| Revenge Anonymous | hold | Риск локальной группы, независимая service structure не подтверждена. |
| S-Ateen | hold | Отдельная youth fellowship под S-Anon; нужна единая продуктовая политика для youth wings. |
| Spenders Anonymous как дубль DA | отклонено | Проверка текущего official сайта подтвердила самостоятельные собрания, поэтому добавлена одна карточка SA, а не дубль DA. |

## Languages

| Language | Query families | Candidates | Unique discoveries | Added |
| --- | ---: | ---: | ---: | ---: |
| English | 18+ | 45+ | 30+ | 16 |
| Russian | 4+ | 8 | 1 | 0 |
| Spanish | 4+ | 6 | 0 | 0 |
| German | 3+ | 4 | 0 | 0 |
| French | 4+ | 6 | 0 | 0 |
| Portuguese | 3+ | 5 | 0 | 0 |
| Italian | 2+ | 4 | 0 | 0 |
| Polish | 1+ | 2 | 0 | 0 |
| Czech | 1+ | 1 | 0 | 0 |
| Ukrainian | 1+ | 2 | 0 | 0 |
| Belarusian | 1+ | 0 | 0 | 0 |
| Kazakh | 1+ | 0 | 0 | 0 |
| Turkish | 1+ | 0 | 0 | 0 |
| Dutch | 2+ | 2 | 0 | 0 |
| Swedish | 1+ | 2 | 0 | 0 |
| Norwegian | 1+ | 1 | 0 | 0 |
| Danish | 1+ | 1 | 0 | 0 |
| Finnish | 1+ | 0 | 0 | 0 |

- Deep search languages: English, Russian, Spanish, French, German, Portuguese.
- Secondary search languages: Italian, Polish, Dutch, Ukrainian.
- Attempted languages: all 18 languages in the table.
- Productive for independent discovery: English; other languages mainly verified national branches and deduplicated translations.

## Track contribution

| Track | Candidate observations | Unique qualified new | Added | Updated |
| --- | ---: | ---: | ---: | ---: |
| Вещества | 15 | 4 | 4 | 8 |
| Поведенческие зависимости | 25 | 7 | 7 | 14 |
| Семьи, отношения, эмоции | 20 | 7 | 4 | 6 |
| Multilingual graph traversal | 7 | 7 | 1 | 4 |

Повторы между треками не считаются повторно в итогах Added/Updated.

## Source and access notes

Использовались official world service sites, official national/intergroup sites, official literature/service manuals, NCBI/PMC, государственные материалы и Wikipedia как дополнительный справочный источник. COSA и SLAA ограничивали автоматический HTTP-доступ защитой от ботов, но страницы были доступны через поисковый индекс/браузер. `spenders.org` отвечал нестабильно при raw-запросах, при этом индекс и страница собраний содержали актуальные данные 2026 года. Неработающий, parked или нерелевантный URL не добавлялся как единственное evidence.

## Remaining gaps

- Проверить current service body COSLAA и исторический статус Methadone Anonymous.
- Принять единую политику по дочерним youth fellowships Alateen/S-Ateen/Narateen.
- Продолжить доказательный аудит 19 оставшихся коротких описаний.
- Отдельно исследовать редкие русскоязычные программы, для которых пока найден только локальный сайт или социальная сеть.
- Категории «отношения и сексуальное поведение» и «цифровые трудности» системно спрятаны в старой таксономии; её изменение требует отдельного согласования.
