export const config = {
  info_group: {
    name: '',
    link: '',
    description: '',
    date: 'Последнее обновление (13.02.2026)'
  },
	release: {
		// Увеличивай на +1 при каждом commit/push:
		// 0 -> 2.1, 1 -> 2.2, 2 -> 2.3, 3 -> 2.4, 4 -> 2.5, 5 -> 3.0, 6 -> 3.1 и т.д.
		versionStep: 2,
		// Обновляется автоматически pre-push hook (время Астаны, UTC+5)
		lastPushedAt: "2026-02-14T16:33:00+05:00",
		timeZone: "Asia/Almaty",
		utcOffsetLabel: "UTC+5",
		locale: "ru-RU",
	},
	site: {
		OG: {
			title: "Unity One — мы о 12 шагов восстановления/выздоровления и программе 12 шагов. Меняемся к лучшему!",
			description:
				"Единое пространство о программе 12 шагов: статьи, методы, сообщества и практики для личных изменений.",
			author: "OneMan",
			locale: "ru_RU",
			site_name: "Unity One", 
			// preview
			defaultImage: "og.png",
			keywords:
				"12 шагов, программа 12 шагов, шаги выздоровления, группы 12 шагов, поиск групп 12 шагов, анонсы групп, объявления групп, размещение групп, телеграм группы 12 шагов, расписание групп 12 шагов, сообщество 12 шагов, традиции аа, 5 традиция, трезвость, взаимопомощь, духовный рост",
		},
		verifications: [
			{ name_verification: "yandex-verification", content: "33e4f028302707d0" },
			{
				name_verification: "google-site-verification",
				content: "_ABSmU2StMDeUbNi9tWowLRPDSfp32TsH0rHkuwbLQo",
			},
			{ name_verification: "msvalidate.01", content: "" },
			{
				name_verification: "p:domain_verify",
				content: "",
			},
			// { name_verification: "", content: "" },
		],
	},
}
