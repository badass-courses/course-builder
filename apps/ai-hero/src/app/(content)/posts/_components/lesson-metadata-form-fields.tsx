import * as React from 'react'
import { Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/spinner'
import { useTranscript } from '@/hooks/use-transcript'
import type { Post, PostSchema } from '@/lib/posts'
import type { Solution } from '@/lib/solutions/solution'
import {
	deleteSolution,
	getSolutionForLesson,
} from '@/lib/solutions/solution-query'
import type { Tag } from '@/lib/tags'
import { api } from '@/trpc/react'
import { ExternalLink, Trash } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'
import AdvancedTagSelector from '@coursebuilder/ui/resources-crud/tag-selector'

import { AddToList } from './add-to-list'
import { PostUploader } from './post-uploader'

/**
 * Metadata form fields for lesson posts.
 * This variant omits SEO-specific fields.
 */
export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceId?: string | null | undefined
	post: Post
	tagLoader: Promise<Tag[]>
	listsLoader: Promise<any>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}> = ({
	form,
	post,
	videoResourceId: initialVideoResourceId,
	tagLoader,
	listsLoader,
	sendResourceChatMessage,
}) => {
	const router = useRouter()
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)
	const tags = tagLoader ? use(tagLoader) : []
	const lists = listsLoader ? use(listsLoader) : []

	const { data: videoResource, refetch } = api.videoResources.get.useQuery({
		videoResourceId: videoResourceId,
	})
	const {
		transcript,
		setTranscript,
		setIsProcessing: setIsTranscriptProcessing,
		TranscriptDialog,
	} = useTranscript({
		videoResourceId,
		initialTranscript: videoResource?.transcript,
	})

	// Omit SEO description generation for lessons
	const [thumbnailTime, setThumbnailTime] = React.useState(0)

	// Solution handling
	const [solution, setSolution] = React.useState<Solution | null>(null)
	const solutionLoader = React.useCallback(async () => {
		const data = await getSolutionForLesson(post.id)
		setSolution(data)
	}, [post.id])

	React.useEffect(() => {
		solutionLoader()
	}, [solutionLoader])

	const handleDeleteSolution = React.useCallback(async () => {
		if (solution) {
			await deleteSolution(solution.id)
			setSolution(null)
			router.refresh()
		}
	}, [solution, router])

	const parsedTagsForUiPackage = z
		.array(
			z.object({
				id: z.string(),
				fields: z.object({
					label: z.string(),
					name: z.string(),
				}),
			}),
		)
		.parse(tags)

	const parsedSelectedTagsForUiPackage = z
		.array(
			z.object({
				tag: z.object({
					id: z.string(),
					fields: z.object({
						label: z.string(),
						name: z.string(),
					}),
				}),
			}),
		)
		.parse(post.tags)

	return (
		<>
			<div>
				<Suspense
					fallback={
						<div className="bg-muted flex aspect-video h-full w-full flex-col items-center justify-center gap-2 p-5 text-sm">
							<Spinner className="h-4 w-4" />
							<span>video is loading</span>
						</div>
					}
				>
					{videoResourceId ? (
						<>
							{videoResource ? (
								<div className="-mt-5 border-b">
									<div>Lesson Video Player (placeholder)</div>
									<div className="flex items-center gap-1 px-4 pb-2">
										<Button
											variant="secondary"
											size="sm"
											type="button"
											onClick={() => setVideoResourceId(null)}
										>
											Replace Video
										</Button>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button type="button" variant="secondary" size="sm">
														Set Thumbnail
													</Button>
												</TooltipTrigger>
												<TooltipContent side="bottom">
													<div className="text-xs">Thumbnail preview here.</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										{transcript ? (
											TranscriptDialog
										) : (
											<span className="px-3 text-xs">
												Processing transcript...
											</span>
										)}
									</div>
								</div>
							) : (
								<div className="bg-muted/75 -mt-5 flex aspect-video h-full w-full flex-col items-center justify-center gap-3 p-5 text-sm">
									<Spinner className="h-5 w-5" />
									<span>video is loading</span>
								</div>
							)}
						</>
					) : (
						<div className="px-5">
							<FormLabel className="text-lg font-bold">Video</FormLabel>
							<PostUploader
								setVideoResourceId={setVideoResourceId}
								parentResourceId={post.id}
							/>
						</div>
					)}
				</Suspense>
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
						<FormDescription>
							A title should summarize the lesson and explain what it is about
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
			{tags?.length > 0 && (
				<div className="px-5">
					<div className="flex w-full items-baseline justify-between">
						<FormLabel className="text-lg font-bold">Tags</FormLabel>
					</div>
					<AdvancedTagSelector
						availableTags={parsedTagsForUiPackage}
						selectedTags={
							parsedSelectedTagsForUiPackage?.map((tag) => tag.tag) ?? []
						}
						onTagSelect={async (tag: { id: string }) => {
							// Add tag logic
						}}
						onTagRemove={async (tagId: string) => {
							// Remove tag logic
						}}
					/>
				</div>
			)}

			{/* Solution Section */}
			<div className="border-muted bg-muted/50 mx-5 mb-6 mt-4 rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-bold">Solution</h3>
						<p className="text-muted-foreground text-sm">
							{solution
								? 'This lesson has a solution attached:'
								: 'Add a solution to this lesson'}
						</p>
					</div>
				</div>

				{solution ? (
					<div className="mt-4 flex items-center justify-between">
						<div className="font-medium">{solution.fields.title}</div>
						<div className="flex gap-2">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => router.push(`/posts/${solution.id}`)}
											className="h-8 w-8"
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="left">
										<p className="text-xs">Edit solution</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<Trash className="h-4 w-4" />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Solution</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this solution? This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleDeleteSolution}>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				) : (
					<Button
						variant="secondary"
						className="mt-2"
						onClick={() => {
							// TODO: Open create solution modal
							// This will be handled by the parent component
						}}
					>
						Add Solution
					</Button>
				)}
			</div>

			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
		</>
	)
}
