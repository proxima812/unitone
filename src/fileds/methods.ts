import { collection, fields } from "@keystatic/core"

export const methods = collection({
	label: "Методы",
	slugField: "title",
	path: "src/data/methods/*",
	entryLayout: "content",
	columns: ["title"],
	format: {
		contentField: "content",
	},
	schema: {
		title: fields.slug({ name: { label: "Заголовок" } }),
		description: fields.text({
			label: "Описание",
			description: "от 20 до 150 символов",
		}),
		community: fields.multiselect({
			label: "Role",
			description: "The person's role at the company",
			options: [
				{ label: "АА", value: "АА" },
				{ label: "АН", value: "АН" },
				{ label: "ВДА", value: "ВДА" },
				{ label: "Художники", value: "АХ" },
				{ label: "MAA", value: "MAA" },
			],
			defaultValue: ["АА"],
		}),
		// pubDate: fields.date({
		// 	label: "Время",
		// 	description: "Время публикации",
		// 	defaultValue: {
		// 		kind: "today",
		// 	},
		// }),
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
