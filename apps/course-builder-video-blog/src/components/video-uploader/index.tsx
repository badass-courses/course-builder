'use client'

import * as React from 'react'
import { uploadToS3 } from '@/video-uploader/upload-to-s3'
import { useFileChange } from '@/video-uploader/use-file-change'

const VideoUploader = () => {
	const {
		fileError,
		fileName,
		fileContents,
		fileType,
		fileDispatch,
		handleFileChange,
	} = useFileChange()
	const [s3FileUrl, setS3FileUrl] = React.useState('')

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		try {
			if (fileType && fileContents) {
				const filePath = await uploadToS3({
					fileType,
					fileContents,
					onUploadProgress: (progressEvent) => {
						console.log(
							'progressEvent',
							progressEvent.total
								? progressEvent.loaded / progressEvent.total
								: 0,
						)
					},
					signingUrl: 'https://joel-x42.coursebuilder.dev/api/upload',
				})

				fileDispatch({ type: 'RESET_FILE_STATE' })
				setS3FileUrl(filePath)
			}
		} catch (err) {
			console.log('error is', err)
		}
	}

	return (
		<>
			<form onSubmit={handleSubmit}>
				<label htmlFor="video">Upload a video</label>
				<input
					type="file"
					accept="video/*"
					id="video"
					name="video"
					onChange={handleFileChange}
				/>
				<button disabled={!fileContents} type="submit">
					Upload to Builder
				</button>
			</form>
			{fileError && <>{fileError}</>}
			<span className="inline-block h-96 w-96">{s3FileUrl}</span>
		</>
	)
}

export default VideoUploader
