import { archive } from "@/fileds/archive"
import { methods } from "@/fileds/methods"
import { config } from "@keystatic/core"

export default config({
	storage: {
		kind: "local",
	},
	collections: {
		archive,
		methods,
	},
})
