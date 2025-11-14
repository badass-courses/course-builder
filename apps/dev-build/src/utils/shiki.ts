import React from 'react'
import { getHighlighter } from 'shiki'

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null

const getCachedHighlighter = React.cache(async () => {
	if (highlighter === null) {
		highlighter = await getHighlighter({
			themes: ['github-light', 'ayu-dark'],
			langs: ['tsx'],
		})
	}

	return highlighter
})

export const codeToHtml = async ({
	code,
	language,
}: {
	code: string
	language: string
}) => {
	try {
		const highlighter = await getCachedHighlighter()
		await highlighter.loadLanguage('tsx')
		await highlighter.loadLanguage('typescript')
		await highlighter.loadLanguage('javascript')
		await highlighter.loadLanguage('jsx')
		await highlighter.loadLanguage('json')
		await highlighter.loadLanguage('bash')
		await highlighter.loadLanguage('html')
		await highlighter.loadLanguage('sql')
		// await highlighter.loadLanguage('yaml')
		// await highlighter.loadLanguage('markdown')

		return highlighter.codeToHtml(code, {
			lang: language,
			themes: {
				light: 'github-light',
				dark: 'ayu-dark', // 'https://shiki.matsu.io/themes'
			},
		})
	} catch (error) {
		console.error(error)
		return code
	}
}
