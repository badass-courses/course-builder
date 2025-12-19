import * as React from 'react'
import { getUniqueFilename } from '@/utils/get-unique-filename'
import { UploadDropzone } from '@/utils/uploadthing'

export function VideoUploader({
	setVideoResourceId,
	parentResourceId,
}: {
	setVideoResourceId: (value: string) => void
	parentResourceId?: string
}) {
	return (
		<div>
			<UploadDropzone
				input={{ parentResourceId }}
				endpoint="videoUploader"
				config={{
					mode: 'auto',
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
				className="[&_label]:text-primary hover:[&_label]:text-primary border-border"
				onUploadError={(error: Error) => {
					// Do something with the error.
					console.log(`ERROR! ${error.message}`)
				}}
			/>
		</div>
	)
}
