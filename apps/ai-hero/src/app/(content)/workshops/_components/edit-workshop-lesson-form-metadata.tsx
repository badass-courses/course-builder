import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import { sendResourceChatMessage } from '@/lib/ai-chat-query'
import { Lesson, type LessonSchema } from '@/lib/lessons'
import { api } from '@/trpc/react'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { EditorView, type Command } from '@codemirror/view'
import MarkdownEditor, { ICommand } from '@uiw/react-markdown-editor'
import {
	Pencil,
	PencilIcon,
	Plus,
	PlusCircle,
	PlusIcon,
	Sparkles,
	Trash,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

import { VideoResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	ScrollArea,
	Textarea,
} from '@coursebuilder/ui'
import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '@coursebuilder/ui/codemirror/editor'
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldSocialImage } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-social-image'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { TagField } from '../../posts/_components/tag-field'
import { LessonVideoResourceField } from './lesson-video-resource-field'

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

	const [isGeneratingDescription, setIsGeneratingDescription] =
		React.useState(false)

	useSocket({
		room: lesson.id || null,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				if (
					data.name === 'resource.chat.completed' &&
					data.requestId === lesson.id &&
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
		setIsGeneratingDescription(true)

		await sendResourceChatMessage({
			resourceId: lesson.id,
			messages: [
				{
					role: 'user',
					content: `Generate a SEO-friendly description for this post. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
				},
			],
			selectedWorkflow: 'prompt-0541t',
		})
	}

	const { theme } = useTheme()

	return (
		<>
			{/* Video Section */}
			<LessonVideoResourceField
				form={form}
				lesson={lesson}
				videoResource={videoResource}
				initialVideoResourceId={videoResource?.id}
			/>
			{/* <ContentVideoResourceField
				resource={lesson}
				form={form}
				thumbnailEnabled={true}
				videoResource={videoResource}
				onVideoUpdate={async (resourceId, videoResourceId) => {
					// Just updates the form value, actual saving happens on form submit
					form.setValue('fields.videoResourceId' as any, videoResourceId)
				}}
				showTranscript={true}
			/> */}

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
			<FormField
				control={form.control}
				name="fields.slug"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Slug</FormLabel>
						<FormDescription>Short with keywords is best.</FormDescription>
						<Input {...field} />
						<FormMessage />
					</FormItem>
				)}
			/>
			<TagField resource={lesson} showEditButton />
			<FormField
				control={form.control}
				name="fields.prompt"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="text-lg font-bold">Prompt</FormLabel>
						<FormDescription>Used by the "Copy prompt" button.</FormDescription>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" className="w-full max-w-full">
									{field.value ? (
										<PencilIcon className="mr-1 size-3" />
									) : (
										<PlusIcon className="mr-1 size-3" />
									)}
									<span className="truncate overflow-ellipsis">
										{field.value || 'Add Prompt'}
									</span>
								</Button>
							</DialogTrigger>
							<DialogContent className="flex max-h-[80vh] min-h-[300px] w-full flex-col">
								<DialogHeader>
									<DialogTitle>Lesson Prompt</DialogTitle>
								</DialogHeader>
								<MarkdownEditor
									className="w-full overflow-y-auto"
									value={field.value || ''}
									minHeight="300px"
									onChange={(value) => field.onChange(value)}
									theme={
										(theme === 'dark'
											? CourseBuilderEditorThemeDark
											: CourseBuilderEditorThemeLight) ||
										CourseBuilderEditorThemeDark
									}
									extensions={[EditorView.lineWrapping]}
								/>
							</DialogContent>
						</Dialog>

						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="fields.optional"
				render={({ field }) => (
					<FormItem className="px-5">
						<FormLabel className="flex items-center gap-2 text-lg font-bold">
							<Checkbox
								name={field.name}
								ref={field.ref}
								onBlur={field.onBlur}
								disabled={field.disabled}
								className="border-input"
								checked={field.value ?? false}
								onCheckedChange={(checked) => field.onChange(!!checked)}
							/>{' '}
							Optional
						</FormLabel>
						<FormDescription>
							Optional lessons are not required to complete the workshop.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			{/* Solution Section */}
			<div className="px-5">
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
					<div className="">
						<div className="flex flex-col items-start gap-2">
							<Link
								href={`/workshops/${module}/${lessonSlug}/solution/edit`}
								className="font-medium underline"
							>
								{solutionResource.fields.title}
							</Link>
							<div className="mb-2 flex items-center space-x-2">
								<Button variant="secondary" size="sm" asChild>
									<Link
										href={`/workshops/${module}/${lessonSlug}/solution/edit`}
									>
										<PencilIcon className="mr-1 size-3" />
										Edit Solution
									</Link>
								</Button>
							</div>
						</div>
						<div className="bg-muted mb-2 rounded-md p-4">
							<ScrollArea className="h-[300px]">
								<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
									{solutionResource.fields.body || 'No solution content yet.'}
								</ReactMarkdown>
							</ScrollArea>
						</div>

						{solutionResource.fields.description && (
							<div className="prose prose-sm dark:prose-invert text-muted-foreground mb-2 max-w-none">
								<p className="text-xs font-medium uppercase">Explanation:</p>
								<ReactMarkdown>
									{solutionResource.fields.description}
								</ReactMarkdown>
							</div>
						)}
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								if (confirm('Are you sure you want to delete this solution?')) {
									deleteSolutionMutation.mutate({
										solutionId: solutionResource.id,
									})
								}
							}}
						>
							<Trash className="mr-1 size-3" />
							Remove
						</Button>
					</div>
				) : (
					<div className="mt-1">
						<Button className="w-full" variant="outline" asChild>
							<Link
								href={`/workshops/${module}/${lesson.fields.slug}/solution/edit`}
							>
								<Plus className="mr-2 h-4 w-4" />
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
						<div className="flex items-center justify-between">
							<FormLabel className="text-lg font-bold">
								SEO Description
							</FormLabel>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="flex items-center gap-1"
								disabled={isGeneratingDescription}
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
