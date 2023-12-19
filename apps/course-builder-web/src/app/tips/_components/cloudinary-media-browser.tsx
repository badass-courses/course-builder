import {useSocket} from '@/hooks/use-socket'
import {api} from '@/trpc/react'
import React from 'react'

export const CloudinaryMediaBrowser = () => {
  const utils = api.useUtils()

  const {data: images = []} = api.imageResources.getAll.useQuery()

  useSocket({
    onMessage: (messageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data)
        if (messageData.name === 'cloudinary.asset.created') {
          utils.imageResources.getAll.invalidate()
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
        {images.map((asset) => {
          return asset?.url ? (
            <div
              key={asset._id}
              className="flex items-center justify-center overflow-hidden rounded border"
            >
              <img src={asset.url} alt={asset._id} />
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}
