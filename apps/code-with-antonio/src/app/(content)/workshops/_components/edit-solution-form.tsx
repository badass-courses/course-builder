'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import {
	ResourceFormProps,
	withResourceForm,
} from '@/components/resource-form/with-resource-form'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Solution, SolutionSchema } from '@/lib/solution'
import { createSolution, updateSolution } from '@/lib/solutions-query'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { VideoResource } from '@coursebuilder/core/schemas/video-resource'
import {
	Button,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Textarea,
} from '@coursebuilder/ui'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { LessonVideoResourceField } from './lesson-video-resource-field'

// Define a simpler interface for what we actually use in the form
interface SolutionFormData extends Solution {
	fields: {
		title: string
		body?: string
		slug: string
		description?: string
		state: 'draft' | 'published' | 'archived' | 'deleted'
		visibility: 'public' | 'private' | 'unlisted'
		thumbnailTime?: number
		optional: boolean | null
	}
}

// Extended props for our solution form
interface SolutionFormProps
	extends ResourceFormProps<SolutionFormData, typeof SolutionSchema> {
	lessonTitle?: string
	videoResource?: VideoResource | null
}

const BaseSolutionForm = ({
	resource,
	form,
	videoResource,
}: ResourceFormProps<SolutionFormData, typeof SolutionSchema> & {
	videoResource?: VideoResource | null
}) => {
	const router = useRouter()
	const params = useParams()
	const moduleId = params?.module as string
	const lessonSlug = params?.lesson as string

	const [isGeneratingDescription, setIsGeneratingDescription] =
		React.useState(false)

	useSocket({
		room: resource.id || null,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				if (
					data.name === 'resource.chat.completed' &&
					data.requestId === resource.id &&
					data.metadata?.workflow === 'prompt-0541t'
				) {
					const lastMessage = data.body[data.body.length - 1]
					if (lastMessage?.content) {
						const description = lastMessage.content.replace(
							/```.*\n(.*)\n```/s,
							'$1',
						)
						form && form.setValue('fields.description', description)
					}
					setIsGeneratingDescription(false)
				}
			} catch (error) {
				setIsGeneratingDescription(false)
			}
		},
	})

	const handleGenerateDescription = async () => {
		// Don't attempt to generate description for new resources without an ID
		if (!resource.id) {
			return
		}

		setIsGeneratingDescription(true)

		await sendResourceChatMessage({
			resourceId: resource.id,
			messages: [
				{
					role: 'user',
					content: `Generate a SEO-friendly description for this post. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
				},
			],
			selectedWorkflow: 'prompt-0541t',
		})
	}
	if (!form) return null

	return (
		<>
			<div className="-mt-4">
				<Button
					type="button"
					variant="ghost"
					className="mb-1 h-8 gap-2"
					onClick={() =>
						router.push(`/workshops/${moduleId}/${lessonSlug}/edit`)
					}
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to Lesson
				</Button>
			</div>

			{/* Video Section */}
			<LessonVideoResourceField
				form={form}
				lesson={resource}
				videoResource={videoResource}
				initialVideoResourceId={videoResource?.id}
			/>

			<FormField
				control={form.control}
				name="id"
				render={({ field }) => <Input type="hidden" {...field} />}
			/>
			<FormField
				control={form.control}
				name="fields.title"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Title</FormLabel>
						<FormDescription>A clear title for this solution.</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<div className="flex items-center justify-between">
							<FormLabel className="text-lg font-bold">
								SEO Description
							</FormLabel>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="flex items-center gap-1"
								disabled={isGeneratingDescription || !resource.id}
								onClick={handleGenerateDescription}
							>
								{isGeneratingDescription ? (
									<Spinner className="h-4 w-4" />
								) : (
									<Sparkles className="h-4 w-4" />
								)}
								Generate
							</Button>
						</div>
						<FormDescription>
							A brief explanation of the approach used in this solution.
						</FormDescription>
						<Textarea {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
		</>
	)
}

/**
 * Solution form with resource form functionality
 * Uses withResourceForm HOC to provide form handling and CRUD operations
 */
export function EditSolutionForm({
	solution,
	lessonId,
	defaultSlug,
	videoResource,
}: {
	solution: Solution | null
	lessonId: string
	defaultSlug?: string
	videoResource: VideoResource | null
}) {
	const router = useRouter()
	const params = useParams()
	const moduleId = params?.module as string
	const lessonSlug = params?.lesson as string

	// We need to cast to the interface expected by the form
	const typedWithResourceForm = withResourceForm as typeof withResourceForm<
		SolutionFormData,
		typeof SolutionSchema
	>

	const SolutionFormWithResource = typedWithResourceForm(
		(props) => <BaseSolutionForm {...props} videoResource={videoResource} />,
		{
			resourceType: 'solution',
			schema: SolutionSchema,
			defaultValues: (resource?: SolutionFormData) => {
				// Create the default values object with the shape expected by the form
				return {
					id: resource?.id || '',
					type: 'solution' as const,
					createdById: resource?.createdById || '',
					createdAt: resource?.createdAt || null,
					updatedAt: resource?.updatedAt || null,
					deletedAt: resource?.deletedAt || null,
					// Include additional fields required by ContentResource
					organizationId: resource?.organizationId || null,
					createdByOrganizationMembershipId:
						resource?.createdByOrganizationMembershipId || null,
					fields: {
						title: resource?.fields?.title || '',
						body: resource?.fields?.body || '',
						slug: resource?.fields?.slug || defaultSlug || '',
						description: resource?.fields?.description || '',
						state: resource?.fields?.state || 'draft',
						visibility: resource?.fields?.visibility || 'unlisted',
						thumbnailTime: resource?.fields?.thumbnailTime || 0,
						optional: resource?.fields?.optional || false,
					},
					resources: resource?.resources || [],
				}
			},
			getResourcePath: () => `/workshops/${moduleId}/${lessonSlug}`,
			updateResource: async (updatedSolution: Partial<SolutionFormData>) => {
				if (!solution?.id) {
					// Create new solution
					const result = await createSolution({
						lessonId,
						title: updatedSolution.fields?.title || '',
						body: updatedSolution.fields?.body || '',
						slug: updatedSolution.fields?.slug || '',
						description: updatedSolution.fields?.description || '',
					})
					// Cast the result to our expected type
					return result as SolutionFormData
				} else {
					// Update existing solution
					const result = await updateSolution(updatedSolution as Solution)
					// Cast the result to our expected type
					return result as SolutionFormData
				}
			},
		},
	)

	// Convert the solution to our form data format with all required fields
	const formSolution: SolutionFormData = (solution as SolutionFormData) || {
		id: '',
		type: 'solution' as const,
		createdById: '',
		createdAt: null,
		updatedAt: null,
		deletedAt: null,
		organizationId: null,
		createdByOrganizationMembershipId: null,
		fields: {
			title: '',
			body: '',
			slug: defaultSlug || '',
			description: '',
			state: 'draft',
			visibility: 'unlisted',
		},
		resources: [],
	}

	return <SolutionFormWithResource resource={formSolution} />
}
