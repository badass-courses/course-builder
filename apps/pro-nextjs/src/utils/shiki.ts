import React from 'react'
import { getHighlighter } from 'shiki'

let highlighter: Awaited<ReturnType<typeof getHighlighter>> | null = null

const getCachedHighlighter = React.cache(async () => {
	if (highlighter === null) {
		highlighter = await getHighlighter({
			themes: ['dark-plus'],
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
		// await highlighter.loadLanguage('typescript')
		// await highlighter.loadLanguage('javascript')
		// await highlighter.loadLanguage('jsx')
		// await highlighter.loadLanguage('json')
		// await highlighter.loadLanguage('bash')
		// await highlighter.loadLanguage('yaml')
		// await highlighter.loadLanguage('markdown')
		// await highlighter.loadLanguage('html')

		return highlighter.codeToHtml(code, {
			lang: language,
			theme: 'dark-plus',
		})
	} catch (error) {
		console.error(error)
		return code
	}
}
