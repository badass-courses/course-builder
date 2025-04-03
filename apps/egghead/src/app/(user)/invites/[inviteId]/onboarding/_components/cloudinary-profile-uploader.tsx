'use client'

import React, { type Dispatch, type SetStateAction } from 'react'
import Script from 'next/script'
import { env } from '@/env.mjs'

import { Button } from '@coursebuilder/ui'

export const CloudinaryUploadButton: React.FC<{
	dir: string
	id: string
	onImageUploadedAction: Dispatch<SetStateAction<string>>
}> = ({ dir, id, onImageUploadedAction }) => {
	const cloudinaryRef = React.useRef<any>(null)
	const widgetRef = React.useRef<any>(null)
	const containerRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		cloudinaryRef.current = (window as any).cloudinary
	}, [])

	return (
		<div className="">
			<Script
				strategy="afterInteractive"
				onLoad={() => {
					cloudinaryRef.current = (window as any).cloudinary
				}}
				src="https://upload-widget.cloudinary.com/global/all.js"
				type="text/javascript"
			/>
			<div className="w-fit p-5">
				<span className="text-muted-foreground mb-2 block text-balance text-sm">
					Upload a profile image for your instructor profile. A square 1000x1000
					image works best.
				</span>
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
									onImageUploadedAction(result.info.secure_url)
								}
							},
						)
						widgetRef.current.open()
					}}
				>
					Upload Profile Image
				</Button>
			</div>
			<div ref={containerRef} id="cloudinary-upload-widget-container" />
		</div>
	)
}
