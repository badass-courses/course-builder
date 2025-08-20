import { EmbedVideoPage } from '../../(embed)/embed/_components/embed-video-page'

type Props = {
	params: Promise<{
		lesson: string
		module: string
	}>
}

/**
 * Solution embed page - wraps the reusable EmbedVideoPage component for solution videos
 */
export default async function SolutionEmbedPage({ params }: Props) {
	const { lesson: lessonSlug, module: moduleSlug } = await params

	return (
		<EmbedVideoPage
			lessonSlug={lessonSlug}
			moduleSlug={moduleSlug}
			resourceType="solution"
		/>
	)
}
