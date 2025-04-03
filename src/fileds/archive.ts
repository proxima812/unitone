import { collection, fields } from "@keystatic/core"

export const archive = collection({
	label: "Архив",
	slugField: "title",
	path: "src/data/archive/*",
	entryLayout: "content",
	columns: ["title", "pubDate"],
	format: {
		contentField: "content",
	},
	schema: {
		title: fields.slug({ name: { label: "Заголовок" } }),
		description: fields.text({
			label: "Описание",
			description: "от 20 до 150 символов",
			validation: { length: { min: 20, max: 150 } },
		}),
		viewMainPage: fields.checkbox({
			label: "Показать на главной странице",
		}),
		author: fields.select({
			label: "Автор",
			options: [
				{ label: "UnitOne", value: "UnitOne" },
				{ label: "SamGold", value: "SamGold" },
				{ label: "Информатор", value: "Информатор" },
			],
			defaultValue: "UnitOne",
		}),
		pubDate: fields.date({
			label: "Время",
			description: "Время публикации",
			defaultValue: {
				kind: "today",
			},
		}),
		// tags: fields.multiselect({
		// 	label: "Теги к посту",
		// 	description: "Выберите теги",
		// 	options: [
		// 		{ label: "Информация", value: "Информация" },
		// 		{ label: "Для групп", value: "Для групп" },
		// 		{ label: "Инструменты", value: "Инструменты" },
		// 		{ label: "Идеи", value: "Идеи" },
		// 		{ label: "Руководство", value: "Руководство" },
		// 		{ label: "Тест", value: "Тест" },
		// 		{ label: "12 шагов", value: "12 шагов" },
		// 		{ label: "12 традиций", value: "12 традиций" },
		// 	],
		// }),
		// img: fields.image({
		// 	label: "Изображение поста",
		// 	directory: "src/assets/images/posts",
		// 	publicPath: "../../assets/images/posts/",
		// }),
		// favorite: fields.checkbox({
		// 	label: "Избранный пост",
		// 	description: "Избранный пост в начале",
		// }),
		content: fields.mdx({
			label: "Контент",
		}),
	},
})
