export type Locale = "ru" | "en" | "uk" | "es" | "zh-CN"

export const DEFAULT_LOCALE: Locale = "ru"
export const LOCALE_STORAGE_KEY = "unitone_locale"

export const LOCALES: { code: Locale; label: string }[] = [
	{ code: "ru", label: "ru" },
	{ code: "en", label: "en" },
	{ code: "uk", label: "uk" },
	{ code: "es", label: "es" },
	{ code: "zh-CN", label: "zh" },
]

export const i18nKeys = {
	index: {
		meta: { title: "index.meta.title", description: "index.meta.description" },
	},
	about: { title: "about.title", description: "about.description" },
	privacy: { title: "privacy.title", description: "privacy.description" },
	terms: { title: "terms.title", description: "terms.description" },
	disclaimer: { title: "disclaimer.title", description: "disclaimer.description" },
	editorialPolicy: { title: "editorial.title", description: "editorial.description" },
	bookmarks: { title: "bookmarks.title", description: "bookmarks.description" },
	error404: { title: "error404.title", description: "error404.description" },
	faq: { title: "faq.title", description: "faq.description" },
	archive: { title: "archive.title", description: "archive.description" },
	methods: { title: "methods.title", description: "methods.description" },
	authors: { title: "authors.title", description: "authors.description" },
	communities: { title: "communities.title", description: "communities.description" },
	finder: { title: "finder.title", description: "finder.description" },
} as const

type Dict = Record<string, string>

const ru: Dict = {
	"lang.label": "Язык",
	"menu.openTitle": "Мобильное меню",
	"menu.openButton": "меню",
	"theme.toggleAria": "Переключить тему",
	"theme.toLight": "Светлая",
	"theme.toDark": "Темная",
	"nav.communities": "Сообщества",
	"nav.methods": "Методы шагов",
	"nav.archive": "Архив",
	"nav.authors": "Авторы",
	"nav.faq": "FAQ",
	"nav.finder": "Подобрать сообщество",
	"nav.bookmarks": "Закладки",
	"breadcrumbs.aria": "Хлебные крошки",
	"breadcrumbs.home": "Главная",
	"breadcrumbs.archive": "Архив",
	"breadcrumbs.methods": "Методы",
	"breadcrumbs.communities": "Сообщества",
	"breadcrumbs.authors": "Авторы",
	"breadcrumbs.faq": "FAQ",
	"breadcrumbs.finder": "Подбор сообщества",
	"breadcrumbs.bookmarks": "Закладки",
	"breadcrumbs.about": "О проекте",
	"breadcrumbs.privacy": "Конфиденциальность",
	"breadcrumbs.terms": "Условия",
	"breadcrumbs.disclaimer": "Дисклеймер",
	"breadcrumbs.editorialPolicy": "Редакционная политика",
	"footer.pages": "Страницы",
	"footer.methods": "Методы шагов",
	"footer.resources": "Ресурсы",
	"footer.info": "Информация",
	"footer.about": "О проекте",
	"footer.privacy": "Политика конфиденциальности",
	"footer.terms": "Условия использования",
	"footer.disclaimer": "Дисклеймер",
	"footer.editorial": "Ред. политика",
	"footer.made": "сделано с душой и вниманием",
	"footer.noteSources": "Источники: открытые материалы, авторские мнения и личный опыт участников.",
	"footer.noteHumor": "Иногда встречается шуточный контент - относитесь к нему с легкостью.",
	"layout.pwa.title": "Установить приложение на устройство?",
	"layout.pwa.description": "Будет быстрее открываться и работать как отдельное приложение.",
	"layout.pwa.install": "Установить",
	"layout.pwa.later": "Позже",
	"common.reset": "Сбросить",
	"common.foundLabel": "Найдено:",
	"home.titleMain": "12 шагов",
	"home.titleSub": "Материалы, шаги и рабочие инструменты.",
	"home.hero": "Полезная информация, материалы, методы прохождения двенадцати шагов, {count} видов сообществ и многое другое.",
	"home.ctaMethods": "Начать с методов",
	"home.ctaFinder": "Подобрать сообщество",
	"home.quote": "Собираем знания о 12 шагах в одном месте, чтобы каждый нашёл путь к ясности и поддержке. Это карта для тех, кто выбирает перемены и действия.",
	"home.editorial": "Редакция UnitOne",
	"index.meta.title": "12 шагов: материалы, методы и сообщества",
	"index.meta.description": "Единая база о 12 шагах: статьи, практики, методы и сообщества.",
	"index.card.communities.title": "Сообщества",
	"index.card.communities.button": "Смотреть",
	"index.card.communities.description": "Список анонимных двенадцати шаговых сообществ.",
	"index.card.methods.title": "Методы шагов",
	"index.card.methods.button": "Изучить",
	"index.card.methods.description": "Список разных методов прохождения двенадцати шагов.",
	"index.card.archive.title": "Архив",
	"index.card.archive.button": "Подробнее",
	"index.card.archive.description": "Посты, статьи, материалы и прочее.",
	"index.card.faq.title": "FAQ",
	"index.card.faq.button": "Искать",
	"index.card.faq.description": "Анонимные сообщества по категориям.",
	"card.default": "Подробнее",
	"about.title": "О проекте",
	"about.description": "О проекте Unit One: независимая база о 12 шагах, методах и сообществах.",
	"about.p1": "Unit One создан, чтобы собрать материалы о 12 шагах в одном месте и упростить поиск знаний, методов и сообществ.",
	"about.goals": "Цели проекта",
	"about.g1": "Систематизировать материалы о 12 шагах и сделать их доступными.",
	"about.g2": "Помочь людям находить подходящие сообщества и форматы работы.",
	"about.g3": "Публиковать проверенные практики и методы прохождения шагов.",
	"about.g4": "Поддерживать ясность, честность и уважение к личному пути каждого.",
	"about.g5": "Развивать безопасное пространство знаний без рекламы и давления.",
	"about.p2": "Проект независим и не представляет ни одно сообщество. Все тексты собраны из открытых источников и предназначены для справочного ознакомления.",
	"privacy.title": "Политика конфиденциальности",
	"privacy.description": "Как мы обрабатываем данные и что важно знать о конфиденциальности.",
	"privacy.p1": "Мы уважаем вашу конфиденциальность. Сайт не собирает персональные данные без вашего явного согласия.",
	"privacy.l1": "Мы не запрашиваем ваше имя, телефон или адрес.",
	"privacy.l2": "Аналитика может использоваться в агрегированном виде для улучшения сайта.",
	"privacy.l3": "Сторонние ссылки ведут на внешние ресурсы с их собственной политикой.",
	"privacy.p2": "Если у вас есть вопросы, напишите через доступные каналы сообщества.",
	"terms.title": "Условия использования",
	"terms.description": "Правила использования материалов и ответственность сторон.",
	"terms.p1": "Используя сайт, вы соглашаетесь с тем, что материалы предоставляются как есть и носят справочный характер.",
	"terms.l1": "Материалы не заменяют профессиональную помощь.",
	"terms.l2": "Ответственность за использование информации лежит на пользователе.",
	"terms.l3": "Сайт может обновляться без предварительного уведомления.",
	"terms.p2": "Если вы не согласны с условиями, пожалуйста, не используйте сайт.",
	"disclaimer.title": "Дисклеймер",
	"disclaimer.description": "Важные юридические уточнения и границы ответственности.",
	"disclaimer.p1": "Материалы сайта носят информационный характер и созданы для поддержки, ориентира и знакомства с темой.",
	"disclaimer.l1": "Проект не представляет интересы каких-либо организаций.",
	"disclaimer.l2": "Все тексты собраны из открытых источников.",
	"disclaimer.l3": "Ссылки на внешние ресурсы размещены для удобства поиска.",
	"disclaimer.p2": "Если вам нужна персональная помощь, лучше обратиться к профильным специалистам или в подходящее сообщество поддержки.",
	"editorial.title": "Редакционная политика",
	"editorial.description": "Как формируются материалы, какие тексты публикуются и какие принципы мы соблюдаем.",
	"editorial.p1": "Мы собираем материалы из открытых источников и авторских вкладов, чтобы сделать информацию о 12 шагах более понятной и доступной.",
	"editorial.p2": "На сайте могут быть личные мнения, субъективный опыт и разные стили подачи. Мы не претендуем на единственно верную позицию.",
	"editorial.p3": "Часть публикаций может быть с элементами юмора. Такой контент не заменяет серьезную помощь и не должен восприниматься как строгая инструкция.",
	"editorial.p4": "Если вы заметили неточность или хотите предложить правку, используйте доступные каналы связи сообщества.",
	"bookmarks.title": "Закладки",
	"bookmarks.description": "Сохраненные статьи из архива 12 шагов.",
	"bookmarks.p1": "Здесь отображаются статьи, которые вы сохранили. Закладки хранятся в вашем браузере.",
	"bookmarks.empty": "Пока нет закладок.",
	"bookmarks.untitled": "Без названия",
	"bookmarks.open": "Открыть",
	"bookmarks.remove": "Удалить",
	"bookmark.add": "В закладки",
	"bookmark.exists": "В закладках",
	"error404.title": "Ошибка 404 - такой страницы не существует",
	"error404.description": "Страница не найдена. Возможно, она была удалена или перемещена.",
	"methods.back": "Назад к методам",
	"methods.title": "Методы шагов",
	"methods.description": "Методы 12 шагов: воркбуки, группы и практики для прохождения программы.",
	"methods.filterHint": "Выберите сообщество или введите слово - список обновится автоматически.",
	"methods.searchPlaceholder": "Поиск по названию и описанию",
	"methods.searchAria": "Поиск по методам",
	"faq.title": "FAQ",
	"faq.description": "Частые вопросы о 12 шагах, выборе сообщества и старте практики.",
	"archive.title": "Архив 12 шагов",
	"archive.description": "Архив статей о 12 шагах: шаги выздоровления, практики, темы и опыт.",
	"archive.authorShown": "Показаны посты автора:",
	"archive.filterHint": "Выберите теги или введите слово, результат обновится автоматически.",
	"archive.searchPlaceholder": "Поиск по заголовку и описанию",
	"archive.searchAria": "Поиск по архиву",
	"authors.title": "Авторы",
	"authors.description": "Страницы авторов и все их посты.",
	"authors.postsCount": "Постов: {count}",
	"authors.latestPost": "Последняя публикация:",
	"communities.title": "Список сообществ",
	"communities.description": "Каталог 12-шаговых сообществ: темы, контакты и ссылки.",
	"communities.updatedNote": "Группа обновляется.",
	"communities.infoLabel": "Информация:",
	"communities.foundedLabel": "Основан:",
	"communities.yes": "Есть.",
	"communities.no": "Нет.",
	"communities.unknown": "Неизвестно.",
	"communities.goTopic": "Перейти к подтеме сообщества",
	"communities.wikiPage": "Wikipedia страница",
	"finder.title": "Поиск анонимного сообщества по категориям",
	"finder.description": "Категории 12-шаговых сообществ и быстрый поиск нужной группы.",
	"finder.showAll": "Показать все ({count})",
	"finder.descriptionButton": "Описание",
	"finder.wikipediaButton": "Wikipedia",
	"finder.findYandex": "Найти в Yandex",
	"finder.findGoogle": "Найти в Google",
}

const en: Dict = {
	"lang.label": "Language",
	"menu.openTitle": "Mobile menu",
	"menu.openButton": "menu",
	"theme.toggleAria": "Toggle theme",
	"theme.toLight": "Light",
	"theme.toDark": "Dark",
	"nav.communities": "Communities",
	"nav.methods": "Step methods",
	"nav.archive": "Archive",
	"nav.authors": "Authors",
	"nav.faq": "FAQ",
	"nav.finder": "Find a community",
	"nav.bookmarks": "Bookmarks",
	"breadcrumbs.aria": "Breadcrumbs",
	"breadcrumbs.home": "Home",
	"breadcrumbs.archive": "Archive",
	"breadcrumbs.methods": "Methods",
	"breadcrumbs.communities": "Communities",
	"breadcrumbs.authors": "Authors",
	"breadcrumbs.faq": "FAQ",
	"breadcrumbs.finder": "Community finder",
	"breadcrumbs.bookmarks": "Bookmarks",
	"breadcrumbs.about": "About",
	"breadcrumbs.privacy": "Privacy",
	"breadcrumbs.terms": "Terms",
	"breadcrumbs.disclaimer": "Disclaimer",
	"breadcrumbs.editorialPolicy": "Editorial policy",
	"footer.pages": "Pages",
	"footer.methods": "Step methods",
	"footer.resources": "Resources",
	"footer.info": "Information",
	"footer.about": "About project",
	"footer.privacy": "Privacy policy",
	"footer.terms": "Terms of use",
	"footer.disclaimer": "Disclaimer",
	"footer.editorial": "Editorial",
	"footer.made": "made with care and attention",
	"footer.noteSources": "Sources: open materials, authors' opinions, and personal experience.",
	"footer.noteHumor": "Some posts may be humorous - please treat them lightly.",
	"layout.pwa.title": "Install the app on your device?",
	"layout.pwa.description": "It will open faster and work as a standalone app.",
	"layout.pwa.install": "Install",
	"layout.pwa.later": "Later",
	"common.reset": "Reset",
	"common.foundLabel": "Found:",
	"home.titleMain": "12 Steps",
	"home.titleSub": "Materials, steps, and practical tools.",
	"home.hero": "Useful information, materials, methods for working the Twelve Steps, {count} community types, and much more.",
	"home.ctaMethods": "Start with methods",
	"home.ctaFinder": "Find a community",
	"home.quote": "We gather 12-step knowledge in one place so everyone can find clarity and support. This is a map for people choosing change and action.",
	"home.editorial": "UnitOne Editorial",
	"index.meta.title": "12 steps: materials, methods, and communities",
	"index.meta.description": "A unified 12-step base: articles, practices, methods, and communities.",
	"index.card.communities.title": "Communities",
	"index.card.communities.button": "View",
	"index.card.communities.description": "List of anonymous twelve-step communities.",
	"index.card.methods.title": "Step methods",
	"index.card.methods.button": "Explore",
	"index.card.methods.description": "Different methods for working the twelve steps.",
	"index.card.archive.title": "Archive",
	"index.card.archive.button": "Details",
	"index.card.archive.description": "Posts, articles, materials, and more.",
	"index.card.faq.title": "FAQ",
	"index.card.faq.button": "Search",
	"index.card.faq.description": "Anonymous communities by category.",
	"card.default": "Read more",
	"about.title": "About the project",
	"about.description": "About Unit One: an independent knowledge base on 12 steps, methods, and communities.",
	"about.p1": "Unit One was created to gather 12-step materials in one place and simplify access to knowledge, methods, and communities.",
	"about.goals": "Project goals",
	"about.g1": "Systematize 12-step materials and make them accessible.",
	"about.g2": "Help people find suitable communities and formats.",
	"about.g3": "Publish proven practices and step-working methods.",
	"about.g4": "Support clarity, honesty, and respect for each personal path.",
	"about.g5": "Develop a safe knowledge space without ads or pressure.",
	"about.p2": "The project is independent and does not represent any community. All texts are collected from open sources for informational purposes.",
	"privacy.title": "Privacy policy",
	"privacy.description": "How we process data and what matters for your privacy.",
	"privacy.p1": "We respect your privacy. The site does not collect personal data without your explicit consent.",
	"privacy.l1": "We do not ask for your name, phone number, or address.",
	"privacy.l2": "Analytics may be used in aggregated form to improve the site.",
	"privacy.l3": "External links lead to third-party resources with their own policies.",
	"privacy.p2": "If you have questions, contact us through available community channels.",
	"terms.title": "Terms of use",
	"terms.description": "Rules for using materials and liability limits.",
	"terms.p1": "By using the site, you agree that materials are provided as-is and for informational purposes.",
	"terms.l1": "Materials do not replace professional help.",
	"terms.l2": "You are responsible for how you use the information.",
	"terms.l3": "The site may be updated without prior notice.",
	"terms.p2": "If you do not agree with these terms, please do not use the site.",
	"disclaimer.title": "Disclaimer",
	"disclaimer.description": "Important legal clarifications and responsibility boundaries.",
	"disclaimer.p1": "Site materials are informational and created to support orientation and learning.",
	"disclaimer.l1": "The project does not represent the interests of any organizations.",
	"disclaimer.l2": "All texts are collected from open sources.",
	"disclaimer.l3": "External links are provided for convenience.",
	"disclaimer.p2": "If you need personal help, contact qualified specialists or a relevant support community.",
	"editorial.title": "Editorial policy",
	"editorial.description": "How materials are curated, what gets published, and which principles we follow.",
	"editorial.p1": "We collect materials from open sources and author contributions to make 12-step knowledge easier to find and use.",
	"editorial.p2": "The site may include personal opinions, subjective experience, and different writing styles. We do not claim a single absolute viewpoint.",
	"editorial.p3": "Some publications may contain humor. This content does not replace serious help and should not be treated as strict instruction.",
	"editorial.p4": "If you notice inaccuracies or want to suggest an update, use available community contact channels.",
	"bookmarks.title": "Bookmarks",
	"bookmarks.description": "Saved articles from the 12-step archive.",
	"bookmarks.p1": "Articles you saved appear here. Bookmarks are stored in your browser.",
	"bookmarks.empty": "No bookmarks yet.",
	"bookmarks.untitled": "Untitled",
	"bookmarks.open": "Open",
	"bookmarks.remove": "Remove",
	"bookmark.add": "Add bookmark",
	"bookmark.exists": "Bookmarked",
	"error404.title": "Error 404 - page does not exist",
	"error404.description": "Page not found. It may have been removed or moved.",
	"methods.back": "Back to methods",
	"methods.title": "Step methods",
	"methods.description": "12-step methods: workbooks, groups, and practices.",
	"methods.filterHint": "Choose a community or type a word - the list updates automatically.",
	"methods.searchPlaceholder": "Search by title and description",
	"methods.searchAria": "Search methods",
	"faq.title": "FAQ",
	"faq.description": "Common questions about the 12 steps, choosing a community, and getting started.",
	"archive.title": "12-step archive",
	"archive.description": "Archive of 12-step articles: recovery steps, practices, topics, and experience.",
	"archive.authorShown": "Posts shown for author:",
	"archive.filterHint": "Choose tags or type a word; results update automatically.",
	"archive.searchPlaceholder": "Search by title and description",
	"archive.searchAria": "Search archive",
	"authors.title": "Authors",
	"authors.description": "Author pages and all their posts.",
	"authors.postsCount": "Posts: {count}",
	"authors.latestPost": "Latest post:",
	"communities.title": "Community list",
	"communities.description": "Catalog of 12-step communities: topics, contacts, and links.",
	"communities.updatedNote": "List is being updated.",
	"communities.infoLabel": "Info:",
	"communities.foundedLabel": "Founded:",
	"communities.yes": "Yes",
	"communities.no": "No",
	"communities.unknown": "Unknown",
	"communities.goTopic": "Open community topic",
	"communities.wikiPage": "Wikipedia page",
	"finder.title": "Find an anonymous community by category",
	"finder.description": "12-step community categories and quick group search.",
	"finder.showAll": "Show all ({count})",
	"finder.descriptionButton": "Description",
	"finder.wikipediaButton": "Wikipedia",
	"finder.findYandex": "Find in Yandex",
	"finder.findGoogle": "Find in Google",
}

const uk: Dict = {
	...en,
	"lang.label": "Мова",
	"menu.openTitle": "Мобільне меню",
	"menu.openButton": "меню",
	"home.titleMain": "12 кроків",
	"home.titleSub": "Матеріали, кроки та робочі інструменти.",
	"home.ctaMethods": "Почати з методів",
	"home.ctaFinder": "Підібрати спільноту",
	"bookmarks.empty": "Поки немає закладок.",
	"bookmarks.untitled": "Без назви",
	"bookmarks.open": "Відкрити",
	"bookmarks.remove": "Видалити",
	"bookmark.add": "У закладки",
	"bookmark.exists": "У закладках",
	"error404.title": "Помилка 404 - такої сторінки не існує",
	"methods.back": "Назад до методів",
	"common.reset": "Скинути",
	"common.foundLabel": "Знайдено:",
}

const es: Dict = {
	...en,
	"lang.label": "Idioma",
	"menu.openTitle": "Menú móvil",
	"menu.openButton": "menú",
	"home.titleMain": "12 Pasos",
	"home.titleSub": "Materiales, pasos y herramientas prácticas.",
	"home.ctaMethods": "Empezar con métodos",
	"home.ctaFinder": "Encontrar comunidad",
	"bookmarks.empty": "Aún no hay marcadores.",
	"bookmarks.untitled": "Sin título",
	"bookmarks.open": "Abrir",
	"bookmarks.remove": "Eliminar",
	"bookmark.add": "Guardar",
	"bookmark.exists": "Guardado",
	"error404.title": "Error 404: la página no existe",
	"methods.back": "Volver a métodos",
	"common.reset": "Restablecer",
	"common.foundLabel": "Encontrado:",
}

const zhCN: Dict = {
	...en,
	"lang.label": "语言",
	"menu.openTitle": "移动菜单",
	"menu.openButton": "菜单",
	"home.titleMain": "12步",
	"home.titleSub": "资料、步骤与实用工具。",
	"home.ctaMethods": "从方法开始",
	"home.ctaFinder": "查找社群",
	"bookmarks.empty": "还没有书签。",
	"bookmarks.untitled": "无标题",
	"bookmarks.open": "打开",
	"bookmarks.remove": "删除",
	"bookmark.add": "加入书签",
	"bookmark.exists": "已收藏",
	"error404.title": "404 错误：页面不存在",
	"methods.back": "返回方法列表",
	"common.reset": "重置",
	"common.foundLabel": "找到：",
}

export const TRANSLATIONS: Record<Locale, Dict> = {
	ru,
	en,
	uk,
	es,
	"zh-CN": zhCN,
}

function normalizeLocale(raw?: string | null): Locale {
	if (!raw) return DEFAULT_LOCALE
	const value = raw.toLowerCase()
	if (value.startsWith("ru")) return "ru"
	if (value.startsWith("en")) return "en"
	if (value.startsWith("uk") || value.startsWith("ua")) return "uk"
	if (value.startsWith("es")) return "es"
	if (value.startsWith("zh")) return "zh-CN"
	return DEFAULT_LOCALE
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
	const text = TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS[DEFAULT_LOCALE]?.[key] ?? key
	if (!params) return text
	return text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`))
}

function getParamsFromDataset(el: HTMLElement): Record<string, string> {
	const params: Record<string, string> = {}
	for (const [name, value] of Object.entries(el.dataset)) {
		if (!name.startsWith("i18nParam") || !value) continue
		const key = name.slice("i18nParam".length)
		if (!key) continue
		params[key.charAt(0).toLowerCase() + key.slice(1)] = value
	}
	return params
}

function applyTranslations(locale: Locale): void {
	document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
		const key = el.dataset.i18n
		if (!key) return
		el.textContent = t(locale, key, getParamsFromDataset(el))
	})

	document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
		const key = el.dataset.i18nPlaceholder
		if (!key) return
		el.setAttribute("placeholder", t(locale, key))
	})

	document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
		const key = el.dataset.i18nTitle
		if (!key) return
		el.setAttribute("title", t(locale, key))
	})

	document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
		const key = el.dataset.i18nAriaLabel
		if (!key) return
		el.setAttribute("aria-label", t(locale, key))
	})

	document.querySelectorAll<HTMLElement>("[data-i18n-value]").forEach((el) => {
		const key = el.dataset.i18nValue
		if (!key) return
		el.setAttribute("value", t(locale, key))
	})

	const body = document.body
	const titleKey = body?.dataset.titleKey
	if (titleKey) {
		const base = t(locale, titleKey)
		document.title = `${base} • Unit One`
	}

	const descKey = body?.dataset.descriptionKey
	if (descKey) {
		const desc = t(locale, descKey)
		const metaDesc = document.querySelector('meta[name="description"]')
		if (metaDesc) metaDesc.setAttribute("content", `${desc} • Unit One`)
	}
}

export function getInitialLocale(): Locale {
	try {
		const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
		if (saved) return normalizeLocale(saved)
	} catch {}
	const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]
	for (const lang of langs) {
		const normalized = normalizeLocale(lang)
		if (normalized) return normalized
	}
	return DEFAULT_LOCALE
}

export function setLocale(localeInput: string): Locale {
	const locale = normalizeLocale(localeInput)
	document.documentElement.lang = locale
	document.documentElement.setAttribute("data-locale", locale)
	try {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale)
	} catch {}
	applyTranslations(locale)
	window.dispatchEvent(new CustomEvent("unitone:locale-updated", { detail: { locale } }))
	return locale
}

export function initI18n(): void {
	const locale = setLocale(getInitialLocale())
	window.addEventListener("unitone:locale-change", (event) => {
		const customEvent = event as CustomEvent<{ locale?: string }>
		setLocale(customEvent.detail?.locale || locale)
	})
}
