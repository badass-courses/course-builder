'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TipUploader } from '@/app/tips/_components/tip-uploader'
import { NewTip, NewTipSchema } from '@/lib/tips'
import { createTip } from '@/lib/tips-query'
import { getVideoResource } from '@/lib/video-resource-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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

export function NewResourceWithVideoForm() {
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | undefined
	>()
	const [videoResourceValid, setVideoResourceValid] =
		React.useState<boolean>(false)
	const [isValidatingVideoResource, setIsValidatingVideoResource] =
		React.useState<boolean>(false)
	const router = useRouter()

	const form = useForm<NewTip>({
		resolver: zodResolver(NewTipSchema),
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

	const onSubmit = async (values: NewTip) => {
		try {
			await pollVideoResource(values.videoResourceId).next()
			const tip = await createTip(values)
			if (!tip) {
				// Handle edge case, e.g., toast an error message
				return
			}
			router.push(`/tips/${tip.slug}/edit`)
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
								<TipUploader setVideoResourceId={handleSetVideoResourceId} />
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
