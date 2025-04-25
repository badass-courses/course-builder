import { FileVideo } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@coursebuilder/ui/primitives/button'
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@coursebuilder/ui/primitives/form'
import { Input } from '@coursebuilder/ui/primitives/input'

export function VideoUploadFormItem({
	selectedPostType,
	form,
	videoResourceId,
	setVideoResourceId,
	children,
	handleSetVideoResourceId,
	isValidatingVideoResource,
	videoResourceValid,
}: {
	selectedPostType: string
	form: UseFormReturn<any>
	videoResourceId?: string
	setVideoResourceId: (id: string) => void
	children: (handleSetVideoResourceId: (id: string) => void) => React.ReactNode
	handleSetVideoResourceId: (id: string) => void
	isValidatingVideoResource: boolean
	videoResourceValid: boolean
}) {
	return (
		<FormField
			control={form.control}
			name="videoResourceId"
			render={({ field }) => (
				<FormItem>
					<FormLabel>{videoResourceId ? 'Video' : 'Upload a Video'}</FormLabel>
					<FormDescription>
						<span className="block">
							You can upload a video later if needed.
						</span>
						Your video will be uploaded and then transcribed automatically.
					</FormDescription>
					<FormControl>
						<Input type="hidden" {...field} />
					</FormControl>
					{!videoResourceId ? (
						children(handleSetVideoResourceId)
					) : (
						<div className="mt-5 flex w-full justify-between border-t pt-5">
							<div className="flex flex-col divide-y">
								<span className="text-primary flex items-center gap-2 py-1 text-sm">
									<FileVideo className="h-4 w-4" />
									<span>{videoResourceId}</span>
								</span>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									setVideoResourceId('')
									form.setValue('videoResourceId', '')
								}}
							>
								clear
							</Button>
						</div>
					)}
					{isValidatingVideoResource && !videoResourceValid ? (
						<FormMessage>Processing Upload</FormMessage>
					) : null}

					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
