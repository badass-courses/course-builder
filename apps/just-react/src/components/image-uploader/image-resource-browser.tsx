import React from 'react'
import { useSocket } from '@/hooks/use-socket'
import { api } from '@/trpc/react'
import { Loader2 } from 'lucide-react'

export const ImageResourceBrowser = () => {
	const {
		data: images = [],
		status,
		refetch,
	} = api.imageResources.getAll.useQuery()

	useSocket({
		onMessage: (messageEvent) => {
			try {
				const messageData = JSON.parse(messageEvent.data)
				if (messageData.name === 'image.resource.created') {
					refetch()
				}
			} catch (error) {
				// noting to do
			}
		},
	})

	return (
		<div className="">
			<h3 className="mb-2 inline-flex px-5 text-xl font-bold">Media Browser</h3>
			{status === 'success' && images.length > 0 ? (
				<div className="grid grid-cols-3 gap-1 px-5">
					{images.map((asset) => {
						return asset?.url ? (
							<div
								key={asset.id}
								className="flex aspect-square items-center justify-center overflow-hidden rounded border"
							>
								<img
									src={asset.url.replace('http://', 'https://')}
									alt={asset.id}
									onDragStart={(e) => {
										e.dataTransfer.setData(
											'text/plain',
											`![](${e.currentTarget.src})`,
										)
									}}
								/>
							</div>
						) : null
					})}
				</div>
			) : status === 'pending' ? (
				<div className="flex w-full items-center justify-center gap-2 px-5 py-2">
					<Loader2 className="size-4 animate-spin" />
					<p className="text-sm">Loading images...</p>
				</div>
			) : (
				<div className="mt-5 px-5">
					<p className="mb-2 text-lg">No images found</p>
					<p className="text-sm">Upload some images to get started!</p>
				</div>
			)}
		</div>
	)
}
