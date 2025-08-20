import { EmbedContainer } from './_components/embed-container'
import { EmbedLoadingSkeleton } from './_components/embed-loading-skeleton'

/**
 * Loading UI for embed page
 * Displayed while the async page component is fetching data
 * Note: Cannot access dynamic thumbnail URL here since params are not available in loading.tsx
 */
export default function Loading() {
	return (
		<EmbedContainer lessonSlug={''} moduleSlug={''} isAuthenticated={false}>
			<EmbedLoadingSkeleton />
		</EmbedContainer>
	)
}
