export const AUTHORS = {
	Klia78: {
		avatarUrl: "/users/1.jpg",
	},
	SamGold: {
		avatarUrl: "/users/5.jpg",
	},
	just_green1: {
		avatarUrl: "/users/2.jpg",
	},
	Xima: {
		avatarUrl: "/users/3.webp",
	},
	yuliaM: {
		avatarUrl: "/users/4.jpg",
	},
	Svetlana: {
		avatarUrl: "",
	},
} as const

export type AuthorName = keyof typeof AUTHORS
