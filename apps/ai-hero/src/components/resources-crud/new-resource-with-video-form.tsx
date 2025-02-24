import * as React from 'react'
import { NewPostInput } from '@/lib/posts'
import { isTopLevelResourceType } from '@/lib/resources'
import { createResourceAction } from '@/lib/resources/create-resource-action'
import { log } from '@/server/logger'
import { track } from '@/utils/analytics'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	type ContentResource,
	type VideoResource,
} from '@coursebuilder/core/schemas'
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { VideoUploadFormItem } from './video-upload-form-item'

const NewResourceWithVideoSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video'),
})

type NewResourceWithVideo = z.infer<typeof NewResourceWithVideoSchema>

const FormValuesSchema = NewResourceWithVideoSchema.extend({
	postType: z.string(),
	videoResourceId: z.string().optional(),
})

type FormValues = z.infer<typeof FormValuesSchema>

/**
 * Form for creating a new resource with an optional video attachment.
 * Supports creating both top-level resources (workshop, tutorial) and post subtypes (article, podcast).
 *
 * @param props - Component props
 * @param props.getVideoResource - Function to retrieve a video resource by ID or slug
 * @param props.createResource - Function to create a post resource
 * @param props.onResourceCreated - Callback when a resource is created
 * @param props.availableResourceTypes - List of resource types available for selection
 * @param props.defaultPostType - Default resource type to select
 * @param props.className - Additional CSS classes
 * @param props.children - Render prop for video upload UI
 * @param props.uploadEnabled - Whether video upload is enabled
 * @param props.topLevelResourceTypes - List of top-level resource types (not post subtypes)
 */
export function NewResourceWithVideoForm({
	getVideoResource,
	createResource,
	onResourceCreated,
	availableResourceTypes,
	defaultPostType = 'article',
	className,
	children,
	uploadEnabled = true,
	topLevelResourceTypes = [],
}: {
	getVideoResource: (idOrSlug?: string) => Promise<VideoResource | null>
	createResource: (values: NewPostInput) => Promise<ContentResource>
	onResourceCreated: (resource: ContentResource, title: string) => Promise<void>
	availableResourceTypes?: string[] | undefined
	defaultPostType?: string
	className?: string
	children: (
		handleSetVideoResourceId: (value: string) => void,
	) => React.ReactNode
	uploadEnabled?: boolean
	topLevelResourceTypes?: string[]
}) {
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | undefined
	>()
	const [videoResourceValid, setVideoResourceValid] =
		React.useState<boolean>(false)
	const [isValidatingVideoResource, setIsValidatingVideoResource] =
		React.useState<boolean>(false)

	const form = useForm<FormValues>({
		resolver: zodResolver(FormValuesSchema),
		defaultValues: {
			title: '',
			videoResourceId: undefined,
			postType: defaultPostType,
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

	const [isSubmitting, setIsSubmitting] = React.useState(false)

	const onSubmit = async (values: FormValues) => {
		try {
			setIsSubmitting(true)
			if (values.videoResourceId) {
				await pollVideoResource(values.videoResourceId).next()
			}

			const selectedType = values.postType
			let resource: ContentResource | null = null

			// Check if the selected type is a top-level resource type or a post subtype
			if (
				topLevelResourceTypes.includes(selectedType) ||
				isTopLevelResourceType(selectedType)
			) {
				// If it's a top-level resource type, use createResourceAction
				track('create_top_level_resource', {
					resourceType: selectedType,
					title: values.title,
				})

				resource = await createResourceAction(selectedType, values.title)
			} else {
				// If it's a post subtype, use createPost
				track('create_post', {
					postType: selectedType,
					title: values.title,
				})

				resource = await createResource({
					...values,
					postType: selectedType as any,
					createdById: '',
				})
			}

			if (!resource) {
				console.error('No resource created', {
					resourceType: selectedType,
					title: values.title,
				})
				return
			}

			await onResourceCreated(resource, form.watch('title'))
		} catch (error) {
			console.error(
				'Error creating resource:',
				error instanceof Error ? error.message : String(error),
			)
		} finally {
			setIsSubmitting(false)
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

	const selectedPostType = form.watch('postType')

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn('flex flex-col gap-5', className)}
			>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormDescription>
								A title should summarize the resource and explain what it is
								about clearly.
							</FormDescription>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{availableResourceTypes && availableResourceTypes.length > 1 && (
					<FormField
						control={form.control}
						name="postType"
						render={({ field }) => {
							const descriptions: Record<string, string> = {
								lesson: 'A lesson to be added to a cohort',
								article: 'A standard article',
								podcast:
									'A podcast episode that will be distributed across podcast networks via the egghead podcast',
								course:
									'A collection of lessons that will be distributed as a course',
								workshop: 'A comprehensive hands-on learning experience',
								tutorial: 'A step-by-step guide to completing a specific task',
							}

							return (
								<FormItem>
									<FormLabel>Type</FormLabel>
									<FormDescription>
										Select the type of resource you are creating.
									</FormDescription>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger className="capitalize">
												<SelectValue placeholder="Select Type..." />
											</SelectTrigger>
											<SelectContent>
												{availableResourceTypes.map((type) => (
													<SelectItem
														className="capitalize"
														value={type}
														key={type}
													>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									{field.value && (
										<div className="text-muted-foreground w-full text-right text-sm italic">
											{descriptions[field.value] || `A ${field.value} resource`}
										</div>
									)}
									<FormMessage />
								</FormItem>
							)
						}}
					/>
				)}
				{uploadEnabled && (
					<VideoUploadFormItem
						selectedPostType={selectedPostType}
						form={form}
						videoResourceId={videoResourceId}
						setVideoResourceId={setVideoResourceId}
						handleSetVideoResourceId={handleSetVideoResourceId}
						isValidatingVideoResource={isValidatingVideoResource}
						videoResourceValid={videoResourceValid}
					>
						{children}
					</VideoUploadFormItem>
				)}
				<Button
					type="submit"
					variant="default"
					disabled={
						(videoResourceId ? !videoResourceValid : false) || isSubmitting
					}
				>
					{isSubmitting
						? 'Creating...'
						: `Create ${selectedPostType.charAt(0).toUpperCase() + selectedPostType.slice(1)}`}
				</Button>
			</form>
		</Form>
	)
}
