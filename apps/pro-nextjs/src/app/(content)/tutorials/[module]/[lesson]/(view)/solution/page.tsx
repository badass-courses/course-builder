import Page from '../page'

export default async function LessonPage({
	params,
}: {
	params: {
		module: string
		lesson: string
	}
}) {
	return <Page params={params} isSolution={true} />
}
