'use client'

import * as React from 'react'
import { FileVideo, Loader2, X } from 'lucide-react'

import { Button } from '../primitives/button'
import { Input } from '../primitives/input'

/**
 * Props for video upload function
 */
export type VideoUploadProps = {
	/**
	 * Called when video upload completes with video resource ID
	 */
	onUploadComplete: (videoResourceId: string) => void
	/**
	 * Parent resource ID for upload context
	 */
	parentResourceId?: string
}

/**
 * Props for LessonVideoField component
 */
export type LessonVideoFieldProps = {
	/**
	 * Current video resource ID if set
	 */
	videoResourceId?: string
	/**
	 * Called when video is set or cleared
	 */
	onChange: (videoResourceId: string | undefined) => void
	/**
	 * Render prop for video uploader component
	 * Receives props to pass to the uploader
	 */
	children: (props: VideoUploadProps) => React.ReactNode
	/**
	 * Optional parent resource ID
	 */
	parentResourceId?: string
	/**
	 * Whether video upload is required
	 * @default false
	 */
	required?: boolean
}

/**
 * Lesson video field component
 * Wraps video upload functionality for lessons in workshop creation
 *
 * @example
 * ```tsx
 * <LessonVideoField
 *   videoResourceId={lesson.videoResourceId}
 *   onChange={(id) => updateLesson({ videoResourceId: id })}
 * >
 *   {(props) => (
 *     <UploadDropzone
 *       {...props}
 *       endpoint="videoUploader"
 *     />
 *   )}
 * </LessonVideoField>
 * ```
 */
export function LessonVideoField({
	videoResourceId,
	onChange,
	children,
	parentResourceId,
	required = false,
}: LessonVideoFieldProps) {
	const [isValidating, setIsValidating] = React.useState(false)

	const handleUploadComplete = (newVideoResourceId: string) => {
		setIsValidating(true)
		onChange(newVideoResourceId)
		// Simple timeout to show validation state
		setTimeout(() => setIsValidating(false), 500)
	}

	const handleClear = () => {
		onChange(undefined)
	}

	if (videoResourceId) {
		return (
			<div className="border-border bg-muted flex items-center justify-between rounded-md border px-3 py-2">
				<div className="flex items-center gap-2">
					{isValidating ? (
						<Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
					) : (
						<FileVideo className="text-primary h-4 w-4" />
					)}
					<span className="text-foreground text-sm">{videoResourceId}</span>
				</div>
				{!required && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="h-7 px-2"
					>
						<X className="h-3 w-3" />
					</Button>
				)}
			</div>
		)
	}

	return (
		<div className="space-y-2">
			{children({
				onUploadComplete: handleUploadComplete,
				parentResourceId,
			})}
			<Input type="hidden" value={videoResourceId || ''} />
		</div>
	)
}
