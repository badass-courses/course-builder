import * as React from 'react'
import { use } from 'react'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import type { List } from '@/lib/lists'
import { Post, PostSchema } from '@/lib/posts'
import { Sparkles } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
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
import { useSocket } from '@coursebuilder/ui/hooks/use-socket'
import { MetadataFieldState } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-state'
import { MetadataFieldVisibility } from '@coursebuilder/ui/resources-crud/metadata-fields/metadata-field-visibility'

import { AddToList } from './add-to-list'
import { TagField } from './tag-field'
import { VideoResourceField } from './video-resource-field'

export const PostMetadataFormFields: React.FC<{
	form: UseFormReturn<z.infer<typeof PostSchema>>
	videoResource?: VideoResource | null
	videoResourceId?: string | null | undefined
	post: Post
	listsLoader: Promise<List[]>
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
}> = ({
	form,
	post,
	videoResource,
	videoResourceId: initialVideoResourceId,
	listsLoader,
	sendResourceChatMessage,
}) => {
	const lists = listsLoader ? use(listsLoader) : []

	const [isGeneratingDescription, setIsGeneratingDescription] =
		React.useState(false)

	useSocket({
		room: post.id,
		host: env.NEXT_PUBLIC_PARTY_KIT_URL,
		onMessage: async (messageEvent) => {
			try {
				const data = JSON.parse(messageEvent.data)

				if (
					data.name === 'resource.chat.completed' &&
					data.requestId === post.id &&
					data.metadata?.workflow === 'prompt-0541t'
				) {
					const lastMessage = data.body[data.body.length - 1]
					if (lastMessage?.content) {
						const description = lastMessage.content.replace(
							/```.*\n(.*)\n```/s,
							'$1',
						)
						form.setValue('fields.description', description)
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
			resourceId: post.id,
			messages: [
				{
					role: 'user',
					content: `Generate a SEO-friendly description for this post. The description should be under 160 characters, include relevant keywords, and be compelling for search results.`,
				},
			],
			selectedWorkflow: 'prompt-0541t',
		})
	}

	return (
		<>
			<VideoResourceField
				form={form}
				post={post}
				videoResource={videoResource}
				initialVideoResourceId={
					initialVideoResourceId ? videoResource?.id : null
				}
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
							A title should summarize the post and explain what it is about
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
			<TagField resource={post} showEditButton />
			<AddToList lists={lists} post={post} />
			<FormField
				control={form.control}
				name="fields.description"
				render={({ field }) => (
					<FormItem className="px-5">
						<div className="flex items-center justify-between">
							<FormLabel className="text-lg font-bold leading-none">
								SEO Description
								<br />
								<span className="text-muted-foreground text-sm tabular-nums">
									({`${field.value?.length ?? '0'} / 160`})
								</span>
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
							A short snippet that summarizes the post in under 160 characters.
							Keywords should be included to support SEO.
						</FormDescription>
						<Textarea rows={4} {...field} value={field.value ?? ''} />
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
							Direct link to the GitHub file associated with the post.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
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
							Gitpod link to start a new workspace with the post.
						</FormDescription>
						<Input {...field} value={field.value ?? ''} />
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	)
}
