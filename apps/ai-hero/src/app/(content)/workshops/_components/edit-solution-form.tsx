'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
	ResourceFormProps,
	withResourceForm,
} from '@/components/resource-form/with-resource-form'
import { Solution, SolutionSchema } from '@/lib/solution'
import { createSolution, updateSolution } from '@/lib/solutions-query'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'

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
}

const BaseSolutionForm = ({
	resource,
	form,
}: ResourceFormProps<SolutionFormData, typeof SolutionSchema>) => {
	const router = useRouter()
	const params = useParams()
	const moduleId = params?.module as string
	const lesson = params?.lesson as string

	if (!form) return null

	return (
		<>
			<div className="mb-6 px-5">
				<Button
					type="button"
					variant="outline"
					className="gap-2"
					onClick={() => router.push(`/workshops/${moduleId}/${lesson}/edit`)}
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Lesson
				</Button>
			</div>

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
				name="fields.body"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">
							Solution Content
						</FormLabel>
						<FormDescription>
							Add code examples, explanations, and implementation details.
						</FormDescription>
						<Textarea className="min-h-[300px] font-mono" {...field} />
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
}: {
	solution: Solution | null
	lessonId: string
	defaultSlug?: string
}) {
	const router = useRouter()
	const params = useParams()
	const moduleId = params?.module as string
	const lesson = params?.lesson as string

	// We need to cast to the interface expected by the form
	const typedWithResourceForm = withResourceForm as typeof withResourceForm<
		SolutionFormData,
		typeof SolutionSchema
	>

	const SolutionFormWithResource = typedWithResourceForm(BaseSolutionForm, {
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
		getResourcePath: () => `/workshops/${moduleId}/${lesson}`,
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
		onSave: async () => {
			router.push(`/workshops/${moduleId}/${lesson}/edit`)
		},
	})

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
