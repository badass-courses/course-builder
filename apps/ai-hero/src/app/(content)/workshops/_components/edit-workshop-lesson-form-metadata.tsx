import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ContentVideoResourceField } from '@/components/content/content-video-resource-field'
import { Lesson, type LessonSchema } from '@/lib/lessons'
import { api } from '@/trpc/react'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { PlusCircle, Trash } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'
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
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof LessonSchema>>
	videoResource: VideoResource | null
	lesson: Lesson
}> = ({ form, videoResource, lesson }) => {
	const router = useRouter()
	const { module, lesson: lessonSlug } = useParams<{
		module: string
		lesson: string
	}>()

	// Fetch solution for this lesson if it exists
	const {
		data: solutionResource,
		isLoading: solutionLoading,
		refetch: refetchSolution,
	} = api.solutions.getForLesson.useQuery(
		{
			lessonId: lesson.id,
		},
		{
			enabled: !!lesson.id,
		},
	)

	// Solution mutations
	const createSolutionMutation = api.solutions.create.useMutation({
		onSuccess: () => {
			refetchSolution()
		},
	})

	const deleteSolutionMutation = api.solutions.delete.useMutation({
		onSuccess: () => {
			refetchSolution()
		},
	})

	return (
		<>
			{/* Video Section */}
			<ContentVideoResourceField
				resource={lesson}
				form={form}
				videoResource={videoResource}
				onVideoUpdate={async (resourceId, videoResourceId) => {
					// Just updates the form value, actual saving happens on form submit
					form.setValue('fields.videoResourceId' as any, videoResourceId)
				}}
				showTranscript={true}
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
						<FormDescription>
							A title should summarize the tip and explain what it is about
							clearly.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Solution Section */}
			<div className="mt-6 border-t px-5 pt-6">
				<div className="flex items-center justify-between gap-2">
					<label className="text-lg font-bold">Solution</label>
				</div>

				{solutionLoading ? (
					<div className="mt-4 animate-pulse space-y-4">
						<div className="flex items-center justify-between">
							<div className="bg-muted h-5 w-1/3 rounded"></div>
							<div className="flex space-x-2">
								<div className="bg-muted h-9 w-24 rounded"></div>
								<div className="bg-muted h-9 w-24 rounded"></div>
							</div>
						</div>
						<div className="bg-muted h-32 rounded-md p-4"></div>
						<div className="space-y-2">
							<div className="bg-muted-foreground/20 h-3 w-24 rounded"></div>
							<div className="bg-muted-foreground/20 h-4 w-full rounded"></div>
							<div className="bg-muted-foreground/20 h-4 w-3/4 rounded"></div>
						</div>
					</div>
				) : solutionResource ? (
					<div className="mt-4 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">{solutionResource.fields.title}</h3>
							<div className="space-x-2">
								<Button variant="outline" asChild>
									<Link
										href={`/workshops/${module}/${lessonSlug}/solution/edit`}
									>
										Edit Solution
									</Link>
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										if (
											confirm('Are you sure you want to delete this solution?')
										) {
											deleteSolutionMutation.mutate({
												solutionId: solutionResource.id,
											})
										}
									}}
								>
									<Trash className="mr-2 h-4 w-4" />
									Delete Solution
								</Button>
							</div>
						</div>
						<div className="bg-muted rounded-md p-4">
							<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
								{solutionResource.fields.body || 'No solution content yet.'}
							</ReactMarkdown>
						</div>
						{solutionResource.fields.description && (
							<div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none">
								<p className="text-xs font-medium uppercase">Explanation:</p>
								<ReactMarkdown>
									{solutionResource.fields.description}
								</ReactMarkdown>
							</div>
						)}
					</div>
				) : (
					<div className="mt-4">
						<Button asChild>
							<Link
								href={`/workshops/${module}/${lesson.fields.slug}/solution/edit`}
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								Add Solution
							</Link>
						</Button>
					</div>
				)}
			</div>
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Description</FormLabel>
						<FormDescription>
							A short snippet that summarizes the lesson.
						</FormDescription>
						<Textarea {...field} />
						{field.value && field.value.length > 160 && (
							<FormMessage>
								Your description is longer than 160 characters
							</FormMessage>
						)}
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
			<FormField
				control={form.control}
				name="fields.github"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">GitHub</FormLabel>
						<FormDescription>
							Direct link to the GitHub file associated with the lesson.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.gitpod"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Gitpod</FormLabel>
						<FormDescription>
							Gitpod link to start a new workspace with the lesson.
						</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<MetadataFieldSocialImage
				form={form}
				currentSocialImage={getOGImageUrlForResource(form.getValues())}
			/>
		</>
	)
}
