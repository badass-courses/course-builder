#!/usr/bin/env tsx
import {
	NewPostInputSchema,
	type Post,
	type PostAction,
	type PostType,
} from '@/lib/posts'
import {
	cancel,
	intro,
	isCancel,
	log,
	outro,
	select,
	spinner,
	text,
} from '@clack/prompts'
import colors from 'picocolors'

const TOKEN = process.env.AUTH_TOKEN || '3cc95395-b39e-42b3-9f61-26a3290d9534'
const BASE_URL = 'http://localhost:3000'

const adjectives = [
	'Badass',
	'Epic',
	'Radical',
	'Gnarly',
	'Savage',
	'Legendary',
	'Cosmic',
	'Quantum',
	'Turbo',
	'Ultra',
	'Mega',
	'Super',
	'Hyper',
	'Cyber',
	'Neural',
]

const nouns = [
	'Algorithm',
	'Function',
	'Component',
	'Pattern',
	'Architecture',
	'Framework',
	'Protocol',
	'Module',
	'Interface',
	'Abstraction',
	'Pipeline',
	'Workflow',
	'System',
	'Engine',
	'Network',
]

const topics = [
	'TypeScript',
	'React',
	'Node.js',
	'GraphQL',
	'WebAssembly',
	'Rust',
	'Go',
	'Python',
	'Docker',
	'Kubernetes',
	'AI',
	'ML',
	'DevOps',
	'Cloud',
	'Edge',
]

function generateRandomTitle(): string {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
	const noun = nouns[Math.floor(Math.random() * nouns.length)]
	const topic = topics[Math.floor(Math.random() * topics.length)]
	return `${adj} ${noun} for ${topic} Development`
}

async function makeRequest<T, E = unknown>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	try {
		console.log('\n📡 Making request:', {
			url: `${BASE_URL}${path}`,
			method: options.method || 'GET',
			body: options.body ? JSON.parse(options.body as string) : undefined,
		})

		const response = await fetch(`${BASE_URL}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${TOKEN}`,
				...options.headers,
			},
		})

		const data = await response.json()
		console.log('\n📥 Response:', {
			status: response.status,
			data,
		})

		if (!response.ok) {
			log.error(`${colors.red('Error')} [${response.status}]: ${data.error}`)
			if (data.details) {
				log.error(colors.dim('Details:'))
				console.error(data.details)
			}
			throw new Error(data.error || 'API request failed')
		}

		return data as T
	} catch (error) {
		if (error instanceof Error) {
			log.error(`${colors.red('Request Failed')}: ${error.message}`)
		} else {
			log.error(colors.red('An unexpected error occurred'))
			console.error(error)
		}
		throw error
	}
}

async function main() {
	intro(colors.blue('Posts API CLI'))

	try {
		const action = await select({
			message: 'What would you like to do?',
			options: [
				{ value: 'create' as const, label: 'Create a new post' },
				{ value: 'list' as const, label: 'List all posts' },
				{ value: 'get' as const, label: 'Get a post by ID or slug' },
				{ value: 'save' as const, label: 'Update a post' },
				{ value: 'publish' as const, label: 'Publish a post' },
				{ value: 'unpublish' as const, label: 'Unpublish a post' },
				{ value: 'archive' as const, label: 'Archive a post' },
				{ value: 'delete' as const, label: 'Delete a post' },
			],
		})

		if (isCancel(action)) {
			cancel('Operation cancelled')
			process.exit(0)
		}

		const s = spinner()

		switch (action) {
			case 'create': {
				const defaultTitle = generateRandomTitle()
				const titleInput = await text({
					message: 'Enter post title:',
					placeholder: defaultTitle,
					validate: (value) => {
						if (!value && !defaultTitle)
							return 'Title must be at least 2 characters'
						if (value && value.length < 2)
							return 'Title must be at least 2 characters'
						return
					},
				})

				if (isCancel(titleInput)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				const title = titleInput || defaultTitle
				log.info(`Using title: ${colors.cyan(title)}`)

				const postType = await select({
					message: 'Select post type:',
					initialValue: 'article' as PostType,
					options: [
						{ value: 'article' as PostType, label: 'Article', hint: 'default' },
						{ value: 'podcast' as PostType, label: 'Podcast' },
						{ value: 'tip' as PostType, label: 'Tip' },
						{ value: 'course' as PostType, label: 'Course' },
					],
				})

				if (isCancel(postType)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				log.info(`Post type: ${colors.cyan(String(postType))}`)
				s.start('Creating post...')

				const input = NewPostInputSchema.partial().parse({
					title,
					postType,
				})

				try {
					const post = await makeRequest<Post>('/api/posts', {
						method: 'POST',
						body: JSON.stringify(input),
					})
					s.stop('Post created successfully')
					log.success(`Created post with ID: ${colors.green(post.id)}`)
					console.log('\nPost details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to create post')
					throw error
				}
				break
			}

			case 'list': {
				s.start('Fetching posts...')
				try {
					const posts = await makeRequest<Post[]>('/api/posts')
					s.stop('Posts retrieved successfully')
					if (posts.length === 0) {
						log.info(colors.yellow('No posts found'))
					} else {
						log.success(`Found ${colors.green(posts.length.toString())} posts`)
						console.log('\nPosts:')
						console.log(JSON.stringify(posts, null, 2))
					}
				} catch (error) {
					s.stop('Failed to fetch posts')
					throw error
				}
				break
			}

			case 'get': {
				const identifier = await text({
					message: 'Enter post ID or slug:',
					validate: (value) => {
						if (!value) return 'ID or slug is required'
						return
					},
				})

				if (isCancel(identifier)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Fetching post...')
				try {
					const post = await makeRequest<Post>(
						`/api/posts?slugOrId=${identifier}`,
					)
					s.stop('Post retrieved successfully')
					console.log('\nPost details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to fetch post')
					throw error
				}
				break
			}

			case 'save': {
				const id = await text({
					message: 'Enter post ID:',
					validate: (value) => {
						if (!value) return 'Post ID is required'
						return
					},
				})

				if (isCancel(id)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Fetching current post...')
				let currentPost: Post
				try {
					currentPost = await makeRequest<Post>(`/api/posts?slugOrId=${id}`)
					s.stop('Current post retrieved')
				} catch (error) {
					s.stop('Failed to fetch current post')
					throw error
				}

				const title = await text({
					message: 'Enter new title:',
					initialValue: currentPost.fields.title,
					validate: (value) => {
						if (value.length < 2) return 'Title must be at least 2 characters'
						if (value.length > 90)
							return 'Title must be less than 90 characters'
						return
					},
				})

				if (isCancel(title)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				const addVideo = await select({
					message: 'Add/update video resource?',
					options: [
						{ value: 'yes', label: 'Yes' },
						{ value: 'no', label: 'No', hint: 'skip' },
					],
				})

				if (isCancel(addVideo)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				let videoResourceId: string | undefined | null = undefined
				if (addVideo === 'yes') {
					const videoId = await text({
						message: 'Enter video resource ID:',
						initialValue:
							currentPost.resources?.find((r) => r.resource.type === 'video')
								?.resource.id || '',
						validate: (value) => {
							if (!value) return 'Video resource ID is required'
							return
						},
					})

					if (isCancel(videoId)) {
						cancel('Operation cancelled')
						process.exit(0)
					}

					videoResourceId = videoId
				}

				s.start('Updating post...')
				try {
					const updateData = {
						id,
						fields: {
							title,
							body: currentPost.fields.body || '',
							slug: currentPost.fields.slug,
							description: currentPost.fields.description || '',
							state: currentPost.fields.state,
							visibility: currentPost.fields.visibility,
							github: currentPost.fields.github || '',
						},
						tags: currentPost.tags || [],
						videoResourceId,
					}

					const post = await makeRequest<Post>(`/api/posts?id=${id}`, {
						method: 'PUT',
						body: JSON.stringify(updateData),
					})
					s.stop('Post updated successfully')
					console.log('\nUpdated post details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to update post')
					throw error
				}
				break
			}

			case 'publish': {
				const id = await text({
					message: 'Enter post ID:',
					validate: (value) => {
						if (!value) return 'Post ID is required'
						return
					},
				})

				if (isCancel(id)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Publishing post...')
				try {
					const post = await makeRequest<Post>(
						`/api/posts?id=${id}&action=publish`,
						{
							method: 'PUT',
							body: JSON.stringify({ id }),
						},
					)
					s.stop('Post published successfully')
					console.log('\nPublished post details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to publish post')
					throw error
				}
				break
			}

			case 'unpublish': {
				const id = await text({
					message: 'Enter post ID:',
					validate: (value) => {
						if (!value) return 'Post ID is required'
						return
					},
				})

				if (isCancel(id)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Unpublishing post...')
				try {
					const post = await makeRequest<Post>(
						`/api/posts?id=${id}&action=unpublish`,
						{
							method: 'PUT',
							body: JSON.stringify({ id }),
						},
					)
					s.stop('Post unpublished successfully')
					console.log('\nUnpublished post details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to unpublish post')
					throw error
				}
				break
			}

			case 'archive': {
				const id = await text({
					message: 'Enter post ID:',
					validate: (value) => {
						if (!value) return 'Post ID is required'
						return
					},
				})

				if (isCancel(id)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Archiving post...')
				try {
					const post = await makeRequest<Post>(
						`/api/posts?id=${id}&action=archive`,
						{
							method: 'PUT',
							body: JSON.stringify({ id }),
						},
					)
					s.stop('Post archived successfully')
					console.log('\nArchived post details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to archive post')
					throw error
				}
				break
			}

			case 'delete': {
				const id = await text({
					message: 'Enter post ID:',
					validate: (value) => {
						if (!value) return 'Post ID is required'
						return
					},
				})

				if (isCancel(id)) {
					cancel('Operation cancelled')
					process.exit(0)
				}

				s.start('Deleting post...')
				try {
					const post = await makeRequest<Post>(`/api/posts?id=${id}`, {
						method: 'DELETE',
					})
					s.stop('Post deleted successfully')
					console.log('\nDeleted post details:')
					console.log(JSON.stringify(post, null, 2))
				} catch (error) {
					s.stop('Failed to delete post')
					throw error
				}
				break
			}
		}
	} catch (error) {
		if (error instanceof Error) {
			log.error(`\n${colors.red('Error')}: ${error.message}`)
		} else {
			log.error(colors.red('\nAn unexpected error occurred'))
			console.error(error)
		}
		process.exit(1)
	}

	outro('Done!')
}

main().catch((error) => {
	log.error(colors.red('\nFatal Error:'))
	console.error(error)
	process.exit(1)
})
