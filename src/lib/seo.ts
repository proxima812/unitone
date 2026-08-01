import {
	assembleGraph,
	buildArticle,
	buildBreadcrumbList,
	buildPiece,
	buildWebPage,
	buildWebSite,
	makeIds,
} from "@jdevalk/seo-graph-core"

export const SITE_URL = "https://unityone.space"
export const SITE_NAME = "Unity One"
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`

const ids = makeIds({ siteUrl: SITE_URL })
const organizationId = `${SITE_URL}/#organization`

export type BreadcrumbItem = {
	name: string
	url: string
}

export type FaqItem = {
	question: string
	answer: string
}

type BuildPageGraphOptions = {
	url: string
	title: string
	description: string
	breadcrumbs: BreadcrumbItem[]
	datePublished?: string
	dateModified?: string
	author?: string
	faq?: FaqItem[]
}

export function buildPageGraph({
	url,
	title,
	description,
	breadcrumbs,
	datePublished,
	dateModified,
	author = "OneMan",
	faq,
}: BuildPageGraphOptions) {
	const publishedAt = datePublished ? new Date(datePublished) : undefined
	const modifiedAt = dateModified ? new Date(dateModified) : undefined
	const pieces = [
		buildPiece({
			"@type": "Organization",
			"@id": organizationId,
			name: SITE_NAME,
			url: SITE_URL,
		}),
		buildWebSite(
			{
				url: SITE_URL,
				name: SITE_NAME,
				publisher: { "@id": organizationId },
			},
			ids,
		),
		buildWebPage(
			{
				url,
				name: title,
				description,
				isPartOf: { "@id": ids.website },
				breadcrumb: { "@id": ids.breadcrumb(url) },
				...(modifiedAt ? { dateModified: modifiedAt } : {}),
			},
			ids,
		),
		buildBreadcrumbList({ url, items: breadcrumbs }, ids),
	]

	if (publishedAt) {
		pieces.push(
			buildArticle(
				{
					url,
					isPartOf: { "@id": ids.webPage(url) },
					author: { "@id": organizationId, name: author },
					publisher: { "@id": organizationId },
					headline: title,
					description,
					datePublished: publishedAt,
					...(modifiedAt ? { dateModified: modifiedAt } : {}),
				},
				ids,
				"BlogPosting",
			),
		)
	}

	if (faq?.length) {
		pieces.push(
			buildPiece({
				"@type": "FAQPage",
				"@id": `${url}#faq`,
				mainEntity: faq.map((item) => ({
					"@type": "Question",
					name: item.question,
					acceptedAnswer: {
						"@type": "Answer",
						text: item.answer,
					},
				})),
			}),
		)
	}

	return assembleGraph(pieces as unknown as Parameters<typeof assembleGraph>[0])
}
