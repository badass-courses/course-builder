import { EmbedLoadingSkeleton } from '../../(embed)/embed/_components/embed-loading-skeleton'

/**
 * Loading state for solution embed
 */
export default function SolutionEmbedLoading() {
	return (
		<div className="flex h-screen w-full items-center justify-center overflow-hidden bg-black">
			<EmbedLoadingSkeleton />
		</div>
	)
}
