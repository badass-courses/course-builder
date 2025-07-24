import * as React from 'react'
import { getUniqueFilename } from '@/utils/get-unique-filename'
import { UploadDropzone } from '@/utils/uploadthing'
import { UploadCloud, Youtube, YoutubeIcon } from 'lucide-react'

export function PostUploader({
	setVideoResourceId,
	parentResourceId,
}: {
	setVideoResourceId: (value: string) => void
	parentResourceId?: string
}) {
	return (
		<div>
			<UploadDropzone
				className="aspect-video rounded-none"
				input={{ parentResourceId }}
				endpoint="videoUploader"
				config={{
					mode: 'auto',
				}}
				content={{
					label: 'Upload Video',
					uploadIcon: (
						<div className="bg-muted aspect-square rounded-full p-2">
							<YoutubeIcon
								strokeWidth={1}
								className="dark:text-muted-foreground text-foreground h-8 w-8"
							/>
						</div>
					),
				}}
				appearance={{
					container() {
						return {
							cursor: 'pointer',
							background: 'hsl(var(--muted))',
							border: '1px dashed hsl(var(--input))',
							padding: '0.5rem 1rem',
						}
					},
					label({}) {
						return {
							color: 'hsl(var(--foreground))',
							fontWeight: 'normal',
						}
					},
					button() {
						return {
							background: 'hsl(var(--background))',
							color: 'hsl(var(--foreground))',
							border: 'none',
							padding: '0.5rem 1rem',
							fontSize: '0.875rem',
						}
					},
				}}
				onBeforeUploadBegin={(files) => {
					return files.map(
						(file) =>
							new File([file], getUniqueFilename(file.name), {
								type: file.type,
							}),
					)
				}}
				onClientUploadComplete={async (response: any) => {
					if (response[0].name) setVideoResourceId(response[0].name)
				}}
				onUploadError={(error: Error) => {
					// Do something with the error.
					alert(`ERROR! ${error.message}`)
				}}
			/>
		</div>
	)
}
