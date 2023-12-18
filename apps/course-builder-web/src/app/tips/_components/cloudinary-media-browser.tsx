import {useSocket} from '@/hooks/use-socket'
import {CloudinaryWebhookEvent} from '@/inngest/events/cloudinary-webhook'
import {api} from '@/trpc/react'
import React from 'react'

export const CloudinaryMediaBrowser = () => {
  const utils = api.useUtils()
  const [mediaAssets, setMediaAssets] = React.useState<
    CloudinaryWebhookEvent[]
  >([])

  useSocket({
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)
        if (messageData.name === 'cloudinary.asset.created') {
          setMediaAssets([...mediaAssets, messageData.body])
        }
      } catch (error) {
        // noting to do
      }
    },
  })
  return (
    <div>
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Media Browser</h3>
      <div className="grid grid-cols-2 gap-1 p-2">
        {mediaAssets.map((asset) => {
          return asset?.secure_url ? (
            <div
              key={asset.public_id}
              className="flex items-center justify-center overflow-hidden rounded border"
            >
              <img
                width={asset.width}
                height={asset.height}
                src={asset.secure_url}
                alt={asset.public_id}
              />
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}
