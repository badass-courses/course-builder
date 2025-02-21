import * as React from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { env } from '@/env.mjs'
import { useTranscript } from '@/hooks/use-transcript'
import type { Post, PostSchema } from '@/lib/posts'
import type { Solution } from '@/lib/solutions/solution'
import {
	addSolutionResourceToLesson,
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
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { CreatePostModal } from './create-post-modal'
import { TagField } from './tag-field'
import { VideoResourceField } from './video-resource-field'

/**
 * Metadata form fields for lesson posts.
 * This variant omits SEO-specific fields.
 */
export const LessonMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResourceId?: string | null | undefined
	post: Post
}> = ({ form, post, videoResourceId: initialVideoResourceId }) => {
	const router = useRouter()
	const [videoResourceId, setVideoResourceId] = React.useState<
		string | null | undefined
	>(initialVideoResourceId)

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

	useSocket({
		room: videoResourceId,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				switch (data.name) {
					case 'video.asset.ready':
					case 'videoResource.created':
						if (data.body.id) {
							setVideoResourceId(data.body.id)
						}

						router.refresh()

						break
					case 'transcript.ready':
						setTranscript(data.body)
						setIsTranscriptProcessing(false)
						break
					default:
						break
				}
			} catch (error) {
				// nothing to do
			}
		},
	})

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

	const [showCreateSolutionModal, setShowCreateSolutionModal] =
		React.useState(false)

	return (
		<>
			<VideoResourceField
				form={form}
				post={post}
				initialVideoResourceId={initialVideoResourceId}
				label="Lesson Video"
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
			<TagField post={post} />

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
											onClick={() => router.push(`/posts/${solution.id}/edit`)}
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
						onClick={() => setShowCreateSolutionModal(true)}
					>
						Add Solution
					</Button>
				)}
			</div>

			{/* Create Solution Modal */}
			<CreatePostModal
				open={showCreateSolutionModal}
				onOpenChange={setShowCreateSolutionModal}
				showTrigger={false}
				title="Add Solution"
				availableResourceTypes={['solution']}
				defaultResourceType="solution"
				isSolutionContext={true}
				parentLessonId={post.id}
				onResourceCreated={async (resource) => {
					setShowCreateSolutionModal(false)
					await addSolutionResourceToLesson({
						solutionResourceId: resource.id,
						lessonId: post.id,
					})
					await solutionLoader()
					router.refresh()
				}}
			/>

			<MetadataFieldVisibility form={form} />
			<MetadataFieldState form={form} />
		</>
	)
}
