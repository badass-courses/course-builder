'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import {
	ResourceFormProps,
	withResourceForm,
} from '@/components/resource-form/with-resource-form'
import { Solution, SolutionSchema } from '@/lib/solution'
import { createSolution, updateSolution } from '@/lib/solutions-query'
import { ArrowLeft } from 'lucide-react'
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
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

// Define a simpler interface for what we actually use in the form
interface SolutionFormData extends Solution {
	fields: {
		title: string
		body?: string
		slug: string
		description?: string
		state: 'draft' | 'published' | 'archived' | 'deleted'
		visibility: 'public' | 'private' | 'unlisted'
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

	if (!form) return null

	return (
		<>
			<div className="mb-6 px-5">
				<Button
					type="button"
					variant="outline"
					className="gap-2"
					onClick={() =>
						router.push(`/workshops/${moduleId}/${lessonSlug}/edit`)
					}
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Lesson
				</Button>
			</div>

			{/* Video Section */}
			<ContentVideoResourceField
				resource={resource}
				form={form}
				videoResource={videoResource}
				label="Solution Video"
				onVideoUpdate={async (resourceId, videoResourceId) => {
					// When a video is added, connect it to the solution
					const { addVideoResourceToSolution } = await import(
						'@/lib/solutions-query'
					)
					await addVideoResourceToSolution({
						solutionId: resourceId,
						videoResourceId,
					})
				}}
				showTranscript={true}
				className="mb-6 px-5"
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
						<FormLabel className="text-lg font-bold">Description</FormLabel>
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
