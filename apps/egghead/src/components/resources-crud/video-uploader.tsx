import * as React from 'react'
import { useState } from 'react'
import { getUniqueFilename } from '@/utils/get-unique-filename'
import { UploadDropzone } from '@/utils/uploadthing'

export function VideoUploader({
	setVideoResourceId,
	parentResourceId,
}: {
	setVideoResourceId: (value: string) => void
	parentResourceId?: string
}) {
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [isUploading, setIsUploading] = useState(false)

	return (
		<div>
			{uploadError && (
				<div className="mb-4 rounded bg-red-100 p-3 text-red-800">
					<strong>Upload Error:</strong> {uploadError}
					<div className="mt-2">
						<button
							onClick={() => setUploadError(null)}
							className="text-red-600 underline hover:text-red-800"
						>
							Try Again
						</button>
					</div>
				</div>
			)}

			{!uploadError && (
				<>
					{isUploading && (
						<div className="mb-2 text-sm text-gray-600">
							Uploading video... This may take a moment.
						</div>
					)}
					<UploadDropzone
						input={{ parentResourceId }}
						endpoint="videoUploader"
						config={{
							mode: 'auto',
						}}
						onBeforeUploadBegin={(files) => {
							setIsUploading(true)
							setUploadError(null)
							console.log(
								'Starting upload for files:',
								files.map((f) => ({
									name: f.name,
									size: f.size,
									type: f.type,
								})),
							)

							return files.map(
								(file) =>
									new File([file], getUniqueFilename(file.name), {
										type: file.type,
									}),
							)
						}}
						onClientUploadComplete={async (response: any) => {
							console.log('Upload completed successfully:', response)
							setIsUploading(false)
							if (response[0]?.name) {
								setVideoResourceId(response[0].name)
							} else {
								console.error('Unexpected response format:', response)
								setUploadError(
									'Upload completed but response format was unexpected',
								)
							}
						}}
						className="[&_label]:text-primary [&_label]:hover:text-primary border-border"
						onUploadError={(error: Error) => {
							console.error('Upload error:', error)
							setIsUploading(false)

							// Check for the specific token error
							if (error.message?.includes('Invalid token')) {
								setUploadError(
									'UploadThing configuration error: Missing API credentials. Please add UPLOADTHING_SECRET and UPLOADTHING_APP_ID to your environment variables.',
								)
							} else {
								setUploadError(error.message || 'Unknown upload error occurred')
							}
						}}
					/>
				</>
			)}
		</div>
	)
}
