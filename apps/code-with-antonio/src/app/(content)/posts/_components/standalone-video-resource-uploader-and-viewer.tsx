import * as React from 'react'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { fetchRealtimeVideoToken } from '@/app/actions/realtime'
import { useResource } from '@/components/resource-form/resource-context'
import { env } from '@/env.mjs'
import { useVideoRealtimeSubscription } from '@/hooks/use-video-realtime'
import { api } from '@/trpc/react'
import MuxPlayer from '@mux/mux-player-react'
import { Loader2, MoreVertical, Play } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	ScrollArea,
	Skeleton,
	useToast,
} from '@coursebuilder/ui'

type VideoPreviewModalState = {
	isOpen: boolean
	videoResource?: ContentResource
}

/**
 * Standalone video resource uploader and viewer component with pagination.
 * Displays a library of video resources with infinite scroll loading,
 * drag-and-drop support, and preview functionality.
 */
export default function StandaloneVideoResourceUploaderAndViewer() {
	const [videoResourceId, setVideoResourceId] = React.useState<string | null>(
		null,
	)

	const {
		data: paginatedVideoResources,
		status,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = api.videoResources.getPaginated.useInfiniteQuery(
		{ limit: 10 },
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	)

	// Flatten the paginated results
	const standaloneVideoResources = React.useMemo(() => {
		return paginatedVideoResources?.pages.flatMap((page) => page.items) ?? []
	}, [paginatedVideoResources])

	const subscription = useVideoRealtimeSubscription({
		room: videoResourceId,
		enabled:
			process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true' &&
			Boolean(videoResourceId),
		refreshToken: fetchRealtimeVideoToken,
	})

	React.useEffect(() => {
		if (!subscription?.latestData) return

		const message = subscription.latestData

		if (!message?.data) return

		const { name, body } = message.data

		switch (name) {
			case 'video.asset.ready':
			case 'videoResource.created':
				if (typeof body === 'object' && body && 'id' in body) {
					refetch()
				}
				break
			default:
				break
		}
	}, [subscription?.latestData, refetch])
	const { resource, form } = useResource()
	const { mutate: attachVideoResourceToPost } =
		api.videoResources.attachToPost.useMutation()

	// Update state to use the new type
	const [videoPreviewModal, setVideoPreviewModal] =
		React.useState<VideoPreviewModalState>({
			isOpen: false,
			videoResource: undefined,
		})

	const { toast } = useToast()

	return (
		<ScrollArea className="h-(--pane-layout-height)">
			<div className="mb-3 px-3">
				<PostUploader
					parentResourceId={undefined}
					setVideoResourceId={setVideoResourceId}
				/>
			</div>
			{videoResourceId && (
				<div>
					<h1>Video Resource ID: {videoResourceId}</h1>
				</div>
			)}
			<div className="mb-2 px-3 text-lg font-medium">Library</div>
			{status === 'pending' && (
				<>
					{new Array(5).fill(null).map((_, index) => (
						<Skeleton key={index} className="h-10 w-full even:opacity-50" />
					))}
				</>
			)}
			{standaloneVideoResources.length > 0 && (
				<ul className="flex flex-col">
					{standaloneVideoResources.map((videoResource) => (
						<li
							key={videoResource.id}
							className="group/item"
							onClick={(e) => {
								if (e.metaKey || e.ctrlKey) {
									e.preventDefault()
									navigator.clipboard.writeText(
										`<Video resourceId="${videoResource.id}" />`,
									)
									toast({
										title: 'Copied to clipboard',
										description: 'Video component code copied',
									})
								}
							}}
						>
							<div
								onDragStart={(e) => {
									e.dataTransfer.setData(
										'text/plain',
										`<Video resourceId="${videoResource.id}" />`,
									)
								}}
								draggable
								className="flex items-center justify-between gap-2 px-3 py-1 leading-tight group-even/item:bg-gray-100 dark:group-even/item:bg-gray-950"
							>
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<button
										className="group relative flex shrink-0 items-center justify-center"
										type="button"
										onClick={() => {
											setVideoPreviewModal({
												isOpen: true,
												videoResource,
											})
										}}
									>
										<Play
											fill="currentColor"
											strokeWidth={0}
											className="absolute z-10 h-4 w-4 text-white opacity-0 transition group-hover:opacity-100"
										/>
										<img
											src={`https://image.mux.com/${videoResource.fields?.muxPlaybackId}/thumbnail.png`}
											className="aspect-video h-7 rounded-sm transition group-hover:bg-black/50 group-hover:opacity-75"
										/>
									</button>
									<div className="flex min-w-0 flex-1 flex-col">
										<span
											className="truncate text-sm font-medium"
											title={videoResource.id}
										>
											{videoResource.id}
										</span>
										<span className="text-xs opacity-80">
											{videoResource.createdAt?.toLocaleString()}
										</span>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 shrink-0"
										>
											<MoreVertical className="h-4 w-4" />
											<span className="sr-only">Open menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => {
												form.setValue(
													'fields.body',
													`${form.watch('fields.body')}\n<Video resourceId="${videoResource.id}" />`,
												)
											}}
										>
											Embed video
										</DropdownMenuItem>

										<DropdownMenuItem
											onClick={() => {
												attachVideoResourceToPost({
													postId: resource.id,
													videoResourceId: videoResource.id,
												})
											}}
										>
											Use as primary video
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => {
												setVideoPreviewModal({
													isOpen: true,
													videoResource,
												})
											}}
										>
											Preview
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</li>
					))}
				</ul>
			)}

			{/* Load More Button */}
			{hasNextPage && (
				<div className="flex justify-center p-4">
					<Button
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						variant="outline"
						className="w-full"
					>
						{isFetchingNextPage ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading more...
							</>
						) : (
							'Load more videos'
						)}
					</Button>
				</div>
			)}

			{/* No videos state */}
			{status === 'success' && standaloneVideoResources.length === 0 && (
				<div className="text-muted-foreground flex flex-col items-center justify-center p-8 text-center">
					<Play className="mb-4 h-12 w-12 opacity-50" />
					<p className="text-lg font-medium">No videos yet</p>
					<p className="text-sm">
						Upload your first video above to get started
					</p>
				</div>
			)}

			<VideoPreviewModal
				videoResource={videoPreviewModal.videoResource}
				isOpen={videoPreviewModal.isOpen}
				onOpenChange={(isOpen) =>
					setVideoPreviewModal((prev) => ({
						...prev,
						isOpen,
					}))
				}
			/>
		</ScrollArea>
	)
}

/**
 * Modal component for previewing video resources using MuxPlayer
 * @param videoResource - The video resource to preview
 * @param isOpen - Whether the modal is open
 * @param onOpenChange - Callback for when modal open state changes
 */
function VideoPreviewModal({
	videoResource,
	isOpen = false,
	onOpenChange,
}: {
	videoResource?: ContentResource
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
}) {
	if (!videoResource && isOpen) {
		return null
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl">
				<DialogTitle>Preview</DialogTitle>
				{videoResource && (
					<MuxPlayer
						playbackId={videoResource.fields?.muxPlaybackId}
						thumbnailTime={videoResource.fields?.thumbnailTime}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
