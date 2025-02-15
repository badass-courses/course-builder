import { NextResponse, type NextRequest } from 'next/server'
import { NewPostInputSchema, PostTypeSchema } from '@/lib/posts'
import {
	createPost,
	getPost,
	updatePost,
	writeNewPostToDatabase,
} from '@/lib/posts-query'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const OPTIONS = async () => {
	return NextResponse.json({}, { headers: corsHeaders })
}

// Schema for what the AI can input for post creation
const CreatePostToolSchema = z.object({
	title: z.string().min(1),
	postType: PostTypeSchema,
})

// Schema for what the AI can input for post updates
const UpdatePostToolSchema = z.object({
	postIdOrSlug: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
})

// Schema for batch post creation
const CreatePostsToolSchema = z.object({
	posts: z.array(
		z.object({
			title: z.string().min(1),
			postType: PostTypeSchema,
		}),
	),
})

// Type for what we return
type CreatePostResult = {
	success: boolean
	postId: string
	title: string
	postSlug: string
	message: string
}

export const POST = async (request: NextRequest) => {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	console.log({ user, ability })

	if (!user || ability.cannot('create', 'Content')) {
		return NextResponse.json(
			{ error: 'Unauthorized' },
			{ status: 401, headers: corsHeaders },
		)
	}

	try {
		const { messages } = await request.json()

		const result = streamText({
			model: openai('gpt-4o-mini'),
			messages: [
				{
					role: 'system',
					content: `You are a helpful assistant that manages posts. 

          To create a single post: 
          1. Ask for the title
          2. Ask for the post type (must be one of: lesson, podcast, tip, course, playlist, article)
          3. Create it using the createPost tool

          To create multiple posts: 
		  1. Ask for post types
          2. For each post in the list, ask for title
          3. Use the createPosts tool with the collected information

          To update a post: Ask for the post ID or slug and what needs to be updated (title or description), then use the updatePost tool.
          
          Be concise and friendly in your responses.`,
				},
				...messages,
			],
			tools: {
				createPost: {
					description: 'Creates a new post in the database',
					parameters: CreatePostToolSchema,
					execute: async ({
						title,
						postType,
					}: z.infer<typeof CreatePostToolSchema>) => {
						try {
							const post = await createPost({
								title,
								postType,
								createdById: user.id,
							})

							const result: CreatePostResult = {
								success: true,
								postId: post.id,
								title: title,
								postSlug: post.fields.slug,
								message: `Created post "${title}" with ID ${post.id}`,
							}

							return result
						} catch (error) {
							await log.error('post-assistant.create-post.error', {
								error: error instanceof Error ? error.message : String(error),
								userId: user.id,
								title,
							})
							throw new Error('Failed to create post')
						}
					},
				},
				createPosts: {
					description: 'Creates multiple posts in the database',
					parameters: CreatePostsToolSchema,
					execute: async ({ posts }: z.infer<typeof CreatePostsToolSchema>) => {
						const results = []
						for (const { title, postType } of posts) {
							try {
								const post = await createPost({
									title,
									postType,
									createdById: user.id,
								})
								results.push({
									success: true,
									postId: post.id,
									title,
									postSlug: post.fields.slug,
									message: `Created post "${title}" with ID ${post.id}`,
								})
							} catch (error) {
								await log.error('post-assistant.create-posts.error', {
									error: error instanceof Error ? error.message : String(error),
									userId: user.id,
									title,
								})
								results.push({
									success: false,
									title,
									message: 'Failed to create post',
								})
							}
						}
						return results
					},
				},
				updatePost: {
					description: 'Updates an existing post in the database',
					parameters: UpdatePostToolSchema,
					execute: async ({
						postIdOrSlug,
						title,
						description,
					}: z.infer<typeof UpdatePostToolSchema>) => {
						try {
							const existingPost = await getPost(postIdOrSlug)
							if (!existingPost) {
								throw new Error('Post not found')
							}

							const post = await updatePost(
								{
									id: existingPost.id,
									fields: {
										...existingPost.fields,
										...(title && { title }),
										...(description && { description }),
									},
								},
								'save',
							)

							if (!post) {
								throw new Error('Post not found')
							}

							return {
								success: true,
								postId: post.id,
								title: post?.fields?.title,
								postSlug: post?.fields?.slug,
								message: `Updated post "${post?.fields?.title}"`,
							}
						} catch (error) {
							await log.error('post-assistant.update-post.error', {
								error: error instanceof Error ? error.message : String(error),
								userId: user.id,
								postIdOrSlug,
							})
							throw new Error('Failed to update post')
						}
					},
				},
			},
		})

		return result.toDataStreamResponse()
	} catch (error) {
		await log.error('post-assistant.error', {
			error: error instanceof Error ? error.message : String(error),
		})
		return NextResponse.json(
			{ error: 'Error processing your request' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
