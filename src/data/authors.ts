export const AUTHORS = {
	"K.M.": {
		avatarUrl: "/users/1.jpg",
	},
} as const;

export type AuthorName = keyof typeof AUTHORS;
