import * as React from 'react'
import { PostUploader } from '@/app/(content)/posts/_components/post-uploader'
import { useResource } from '@/components/resource-form/resource-context'
import { env } from '@/env.mjs'
import { api } from '@/trpc/react'
import MuxPlayer from '@mux/mux-player-react'
import { MoreVertical, Play } from 'lucide-react'

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
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'

type VideoPreviewModalState = {
	isOpen: boolean
	videoResource?: ContentResource
}

export default function StandaloneVideoResourceUploaderAndViewer() {
	const [videoResourceId, setVideoResourceId] = React.useState<string | null>(
		null,
	)

	const {
		data: standaloneVideoResources,
		status,
		refetch,
	} = api.videoResources.getAll.useQuery()

	useSocket({
		room: videoResourceId,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							refetch()
						}
						break
					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})
	const { resource, form } = useResource()
	const { mutate: attachVideoResourceToPost } =
		api.videoResources.attachToPost.useMutation()

	// Update state to use the new type
	const [videoPreviewModal, setVideoPreviewModal] =
		React.useState<VideoPreviewModalState>({
			isOpen: false,
			videoResource: undefined,
		})

	return (
		<ScrollArea className="h-[var(--pane-layout-height)]">
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
			{standaloneVideoResources && (
				<ul className="flex flex-col">
					{standaloneVideoResources.map((videoResource) => (
						<li key={videoResource.id} className="group/item">
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
								<div className="flex items-center gap-3">
									<button
										className="group relative flex flex-shrink-0 items-center justify-center"
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
									<div className="flex flex-col">
										<span className="text-sm font-medium">
											{videoResource.id}
										</span>
										<span className="text-xs opacity-80">
											{videoResource.createdAt?.toLocaleString()}
										</span>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="ghost" className="h-8 w-8">
											<MoreVertical className="h-4 w-4" />
											<span className="sr-only">Open menu</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => {
												form.setValue(
													'fields.body',
													`${form.getValues('fields.body')}\n<Video resourceId="${videoResource.id}" />`,
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
											Use as primary resource video
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
