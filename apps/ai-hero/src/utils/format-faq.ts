export const formatFaq = (markdownContent: string) => {
	const questions = markdownContent
		.split('## ')
		.filter((item) => item.trim() !== '')
	const formattedQuestions = questions.map((qst) => {
		const parts = qst.split('\n')
		const question = parts[0]?.trim() || ''
		const answer = parts.slice(1).join('\n').trim()
		return { question, answer }
	})
	return formattedQuestions
}
