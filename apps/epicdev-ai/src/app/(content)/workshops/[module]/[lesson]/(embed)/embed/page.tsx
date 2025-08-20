import { EmbedVideoPage } from './_components/embed-video-page'

type Props = {
	params: Promise<{
		lesson: string
		module: string
	}>
}

/**
 * Lesson embed page - wraps the reusable EmbedVideoPage component
 */
export default async function LessonEmbedPage({ params }: Props) {
	const { lesson: lessonSlug, module: moduleSlug } = await params

	return (
		<EmbedVideoPage
			lessonSlug={lessonSlug}
			moduleSlug={moduleSlug}
			resourceType="lesson"
		/>
	)
}
