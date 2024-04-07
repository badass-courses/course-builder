'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { type VideoResource } from '@coursebuilder/core/schemas'
import { ContentResource } from '@coursebuilder/core/types'
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'

const NewResourceWithVideoSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video'),
})

type NewResourceWithVideo = z.infer<typeof NewResourceWithVideoSchema>

export function NewResourceWithVideoForm({
	getVideoResource,
	createResource,
	onResourceCreated,
	children,
}: {
	getVideoResource: (idOrSlug?: string) => Promise<VideoResource | null>
	createResource: (values: NewResourceWithVideo) => Promise<ContentResource>
	onResourceCreated: (resource: ContentResource) => Promise<void>
	children: (
		handleSetVideoResourceId: (value: string) => void,
	) => React.ReactNode
}) {
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | undefined
	>()
	const [videoResourceValid, setVideoResourceValid] =
		React.useState<boolean>(false)
	const [isValidatingVideoResource, setIsValidatingVideoResource] =
		React.useState<boolean>(false)

	const form = useForm<NewResourceWithVideo>({
		resolver: zodResolver(NewResourceWithVideoSchema),
		defaultValues: {
			title: '',
			videoResourceId: '',
		},
	})

	async function* pollVideoResource(
		videoResourceId: string,
		maxAttempts = 30,
		initialDelay = 250,
		delayIncrement = 250,
	) {
		let delay = initialDelay

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			const videoResource = await getVideoResource(videoResourceId)
			if (videoResource) {
				yield videoResource
				return
			}

			await new Promise((resolve) => setTimeout(resolve, delay))
			delay += delayIncrement
		}

		throw new Error('Video resource not found after maximum attempts')
	}

	const onSubmit = async (values: NewResourceWithVideo) => {
		try {
			await pollVideoResource(values.videoResourceId).next()
			const tip = await createResource(values)
			if (!tip) {
				// Handle edge case, e.g., toast an error message
				return
			}
			onResourceCreated(tip)
		} catch (error) {
			console.error('Error polling video resource:', error)
			// handle error, e.g. toast an error message
		} finally {
			form.reset()
			setVideoResourceId(undefined)
			form.setValue('videoResourceId', '')
		}
	}

	async function handleSetVideoResourceId(videoResourceId: string) {
		try {
			setVideoResourceId(videoResourceId)
			setIsValidatingVideoResource(true)
			form.setValue('videoResourceId', videoResourceId)

			await pollVideoResource(videoResourceId).next()

			setVideoResourceValid(true)
			setIsValidatingVideoResource(false)
		} catch (error) {
			setVideoResourceValid(false)
			form.setError('videoResourceId', { message: 'Video resource not found' })
			setVideoResourceId('')
			form.setValue('videoResourceId', '')
			setIsValidatingVideoResource(false)
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-lg font-bold">Title</FormLabel>
							<FormDescription className="mt-2 text-sm">
								A title should summarize the tip and explain what it is about
								clearly.
							</FormDescription>
							<FormControl>
								<Input {...field} />
							</FormControl>

							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="videoResourceId"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-lg font-bold">
								Upload a Tip Video*
							</FormLabel>
							<FormDescription className="mt-2 text-sm">
								Your video will be uploaded and then transcribed automatically.
							</FormDescription>
							<FormControl>
								<Input type="hidden" {...field} />
							</FormControl>
							{!videoResourceId ? (
								<>{children(handleSetVideoResourceId)}</>
							) : (
								<div>
									{videoResourceId}{' '}
									<Button
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

				<Button
					type="submit"
					className="mt-2"
					variant="default"
					disabled={!videoResourceValid}
				>
					Create Draft Tip
				</Button>
			</form>
		</Form>
	)
}
