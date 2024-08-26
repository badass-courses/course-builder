'use client'

import React from 'react'
import Script from 'next/script'
import { env } from '@/env.mjs'
import { createImageResource } from '@/lib/image-resource-query'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export const CloudinaryUploadButton: React.FC<{
	dir: string
	id: string
	is_downloadable?: boolean
	resourceOfId?: string
}> = ({ dir, id, is_downloadable = false, resourceOfId }) => {
	const session = useSession()
	const cloudinaryRef = React.useRef<any>()
	const widgetRef = React.useRef<any>()
	const containerRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		cloudinaryRef.current = (window as any).cloudinary
	}, [])

	const folder = is_downloadable ? `${dir}/${id}/downloadables` : `${dir}/${id}`

	return session?.data?.user ? (
		<div>
			<Script
				strategy="afterInteractive"
				onLoad={() => {
					cloudinaryRef.current = (window as any).cloudinary
				}}
				src="https://upload-widget.cloudinary.com/global/all.js"
				type="text/javascript"
			/>
			<div className="p-5">
				<Button
					type="button"
					variant="outline"
					className="flex w-full"
					onClick={() => {
						widgetRef.current = cloudinaryRef.current.createUploadWidget(
							{
								cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
								uploadPreset: env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
								// inline_container: '#cloudinary-upload-widget-container',
								folder,
							},
							(error: any, result: any) => {
								if (!error && result && result.event === 'success') {
									console.debug('Done! Here is the image info: ', result.info)
									createImageResource({
										asset_id: result.info.asset_id,
										secure_url: result.info.url,
										public_id: result.info.public_id,
										is_downloadable,
										resourceOfId: id,
									})
								}
							},
						)
						widgetRef.current.open()
					}}
				>
					Upload images
				</Button>
			</div>
			<div ref={containerRef} id="cloudinary-upload-widget-container" />
		</div>
	) : null
}
