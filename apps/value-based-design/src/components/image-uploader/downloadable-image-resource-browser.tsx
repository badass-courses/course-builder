import React from 'react'
import { useSocket } from '@/hooks/use-socket'
import { api } from '@/trpc/react'

export const DownloadableImageResourceBrowser = ({
	resourceId,
}: {
	resourceId: string
}) => {
	const { data: images = [], refetch } =
		api.imageResources.getAllForResource.useQuery({ resourceId })

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
		<div>
			<h3 className="inline-flex px-5 text-lg font-bold">Media Browser</h3>
			<div className="grid grid-cols-3 gap-1 px-5">
				{images.map((asset) => {
					return asset?.url ? (
						<div
							key={asset.id}
							className="flex items-center justify-center overflow-hidden rounded border"
						>
							<img
								src={asset.url}
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
		</div>
	)
}
