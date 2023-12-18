'use client'

import React from 'react'
import Script from 'next/script'
import {Button} from '@coursebuilder/ui'

export const CloudinaryUploadWidget: React.FC<{dir: string; id: string}> = ({
  dir,
  id,
}) => {
  const cloudinaryRef = React.useRef<any>()
  const widgetRef = React.useRef<any>()
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    cloudinaryRef.current = (window as any).cloudinary
  }, [])

  return (
    <div>
      <Script
        strategy="afterInteractive"
        onLoad={() => {
          cloudinaryRef.current = (window as any).cloudinary
        }}
        src="https://upload-widget.cloudinary.com/global/all.js"
        type="text/javascript"
      />
      <h3 className="inline-flex p-5 pb-3 text-lg font-bold">Upload images</h3>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          widgetRef.current = cloudinaryRef.current.createUploadWidget(
            {
              cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
              uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
              // inline_container: '#cloudinary-upload-widget-container',
              folder: `${dir}/${id}`,
            },
            (error: any, result: any) => {
              if (!error && result && result.event === 'success') {
                console.log('Done! Here is the image info: ', result.info)
              }
            },
          )
          widgetRef.current.open()
        }}
      >
        Upload
      </Button>
      <div ref={containerRef} id="cloudinary-upload-widget-container" />
    </div>
  )
}
