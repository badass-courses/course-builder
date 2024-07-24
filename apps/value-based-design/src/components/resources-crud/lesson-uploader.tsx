import * as React from 'react'
import { getUniqueFilename } from '@/utils/get-unique-filename'
import { UploadDropzone } from '@/utils/uploadthing'

export function LessonUploader({
	setVideoResourceId,
	parentResourceId,
	className,
}: {
	setVideoResourceId: (value: string) => void
	parentResourceId?: string
	className?: string
}) {
	return (
		<UploadDropzone
			className={className}
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
			onClientUploadComplete={(response: any) => {
				if (response[0].name) {
					return setVideoResourceId(response[0].name)
				}
			}}
			onUploadError={(error: Error) => {
				// Do something with the error.
				alert(`ERROR! ${error.message}`)
			}}
		/>
	)
}
