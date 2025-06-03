import { collection, fields } from "@keystatic/core"

export const archive = collection({
	label: "Архив",
	slugField: "title",
	path: "src/data/archive/*",
	entryLayout: "content",
	columns: ["title", "pubDate", 'tags'],
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
		tags: fields.multiselect({
			label: "Теги",
			options: [
				{ label: "12 Традиций", value: "12 Традиций" },
				{ label: "Сообщество", value: "Сообщество" },
				{ label: "12 шагов", value: "12 Шагов" },
				{ label: "Материал", value: "Материал" },
				{ label: "Адаптация", value: "Адаптация" },
				{ label: "Руководство", value: "Руководство" },
				// { label: "", value: "" },
			],
		}),
		viewMainPage: fields.checkbox({
			label: "Показать на главной странице",
		}),
		author: fields.select({
			label: "Автор",
			options: [
				{ label: "UnitOne", value: "UnitOne" },
				{ label: "SamGold", value: "SamGold" },
				{ label: "Stepper", value: "Stepper" },
				{ label: "Pythagoras", value: "Pythagoras" },
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
