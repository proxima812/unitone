import { communities } from "./communities"

export const links = [
	{
		label: "Сообщества",
		href: "/communities",
		icon: "mdi:account-group",
	},
	{
		label: "Методы шагов",
		href: "/methods",
		icon: "mdi:lightbulb-group",
	},
	{
		label: "Архив",
		href: "/archive",
		icon: "mdi:archive-check-outline",
	},
	{
		label: "Подобрать сообщество",
		href: "/finder",
		icon: "mdi:account-multiple-check",
	},
	// {
	// 	label: "",
	// 	href: "#",
	// 	target: "",
	// 	icon: "",
	// 	style: "",
	// },
]

export const blockData = [
	{
		link: links[0].href, // Ссылка на "Список сообществ"
		title: links[0].label,
		icon: links[0].icon,
		textBtn: "Смотреть",
		description: `Список из ${communities.length} анонимных двенадцати шаговых сообществ.`,
	},
	{
		link: links[1].href, // Ссылка на "Методы шагов"
		title: links[1].label,
		icon: links[1].icon,
		textBtn: "Изучить",
		description: "Список разных методов прохождения двенадцати шагов.",
	},
	{
		link: links[2].href, // Ссылка на "Архив"
		title: links[2].label,
		icon: links[2].icon,
		textBtn: "Подробнее",
		description: "Посты, статьи, материалы и прочее.",
	},
	{
		link: links[3].href,
		title: links[3].label,
		icon: links[3].icon,
		textBtn: "Искать",
		description: "Анонимные сообщества по категориям.",
	},
]

export const telegrams = [
	{
		label: "12 шагов - Контакты",
		href: "https://t.me/all12_contacts",
	},
	{
		label: "12 шагов - Методы",
		href: "https://t.me/all_12methods",
	},
	{
		label: "12 шагов - База знаний",
		href: "https://t.me/all_12steps",
	},
	{
		label: "5 Традиция. Списки Чатов.",
		href: "https://t.me/+CKAQ_WToYzo1MzYy",
	},
	// {
	// 	label: "",
	// 	href: "",
	// },
]

export const tg_link = "https://t.me/legion_free"
