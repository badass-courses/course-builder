'use client'

import React from 'react'
import Script from 'next/script'
import { env } from '@/env.mjs'
import { createImageResource } from '@/lib/image-resource-query'
import { UploadCloud } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export const CloudinaryUploadButton: React.FC<{ dir: string; id: string }> = ({
	dir,
	id,
}) => {
	const session = useSession()
	const cloudinaryRef = React.useRef<any>(undefined)
	const widgetRef = React.useRef<any>(undefined)
	const containerRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		cloudinaryRef.current = (window as any).cloudinary
	}, [])

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
								folder: `${dir}/${id}`,
							},
							(error: any, result: any) => {
								if (!error && result && result.event === 'success') {
									console.debug('Done! Here is the image info: ', result.info)
									createImageResource({
										asset_id: result.info.asset_id,
										secure_url: result.info.secure_url,
									})
								}
							},
						)
						widgetRef.current.open()
					}}
				>
					<UploadCloud className="size-4" /> Upload images
				</Button>
			</div>
			<div ref={containerRef} id="cloudinary-upload-widget-container" />
		</div>
	) : null
}
