'use server'

import { db } from '@/db'
import { resourceProgress } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { TYPESENSE_COLLECTION_NAME } from '@/utils/typesense-instantsearch-adapter'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import Typesense from 'typesense'
import type { MultiSearchRequestSchema } from 'typesense/lib/Typesense/MultiSearch'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import type { Post, PostAction } from './posts'
import { getPostTags } from './posts-query'
import { getProductForResource } from './products-query'
import { getLessonForSolution } from './solutions-query'
import { TypesenseResourceSchema } from './typesense'
import { getVideoResource } from './video-resource-query'
import { getWorkshopsForLesson } from './workshops-query'

export async function upsertPostToTypeSense(
	post: ContentResource,
	action: PostAction,
) {
	try {
		console.log('🔄 Initializing TypeSense client for upsert:', {
			host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
			hasWriteKey: !!process.env.TYPESENSE_WRITE_API_KEY,
			collection: TYPESENSE_COLLECTION_NAME,
		})

		if (
			!process.env.TYPESENSE_WRITE_API_KEY ||
			!process.env.NEXT_PUBLIC_TYPESENSE_HOST
		) {
			console.error(
				'⚠️ Missing TypeSense configuration, skipping index operation',
			)
			return
		}
		const typesenseWriteClient = new Typesense.Client({
			nodes: [
				{
					host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
					port: 443,
					protocol: 'https',
				},
			],
			apiKey: process.env.TYPESENSE_WRITE_API_KEY!,
			connectionTimeoutSeconds: 2,
		})

		const shouldIndex = true

		if (!shouldIndex) {
			console.log(
				'⚠️ Post not eligible for indexing, attempting deletion:',
				post.id,
			)
			try {
				await typesenseWriteClient
					.collections(TYPESENSE_COLLECTION_NAME)
					.documents(String(post.id))
					.delete()
				console.log('✅ Successfully deleted post from TypeSense:', post.id)
			} catch (err: any) {
				console.error('⚠️ Failed to delete post from TypeSense (non-fatal):', {
					postId: post.id,
					error: err.message || err,
				})
			}
			return
		}

		console.log('🔍 Fetching tags for post:', post.id)
		const tags = await getPostTags(post.id).catch((err) => {
			console.error('⚠️ Failed to fetch tags (continuing without tags):', err)
			return []
		})

		let parentResources = null
		if (post.type === 'lesson') {
			console.log('🔍 Getting parent resources (workshops) for lesson', post.id)
			parentResources = await getWorkshopsForLesson(post.id)
			console.log('✅ Retrieved parent resources:', parentResources.length)
		}
		if (post.type === 'solution') {
			console.log('🔍 Getting parent resources (lesson) for solution', post.id)
			const lesson = await getLessonForSolution(post.id)
			if (lesson) {
				const workshops = await getWorkshopsForLesson(lesson.id)
				parentResources = [lesson, ...workshops]
				console.log(
					'✅ Retrieved parent resources for solution',
					parentResources.length,
				)
			}
		}
		const product = await getProductForResource(post.id)

		console.log('✅ Retrieved tags:', tags.length)

		// Get video thumbnail if post has a video
		let videoThumbnailUrl = ''
		const videoResourceId =
			post.resources?.find(
				(resource) => resource.resource?.type === 'videoResource',
			)?.resourceId || (post.fields as any)?.videoResourceId

		if (videoResourceId) {
			try {
				const videoResource = await getVideoResource(videoResourceId)
				if (videoResource?.muxPlaybackId) {
					const thumbnailTime =
						(post.fields as any)?.thumbnailTime ||
						(videoResource as any)?.fields?.thumbnailTime ||
						0
					videoThumbnailUrl = `https://image.mux.com/${videoResource.muxPlaybackId}/thumbnail.png?time=${thumbnailTime}&width=880`
					console.log('🎥 Found video thumbnail:', videoThumbnailUrl)
				}
			} catch (err) {
				console.error('⚠️ Failed to fetch video resource for thumbnail:', err)
			}
		}

		console.log('🔄 Validating resource schema')
		const resource = TypesenseResourceSchema.safeParse({
			id: post.id,
			title: post.fields?.title,
			slug: post.fields?.slug,
			description: post.fields?.body || '',
			summary: post.fields?.description || '',
			image:
				videoThumbnailUrl ||
				post.fields?.coverImage?.url ||
				post.fields?.image ||
				'',
			type:
				post?.fields && 'postType' in post.fields
					? post.fields.postType
					: post?.fields && 'type' in post.fields
						? post.fields.type
						: post.type,
			visibility: post.fields?.visibility,
			state: post.fields?.state,
			created_at_timestamp: post.createdAt?.getTime() ?? Date.now(),
			updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
			...(post.fields?.startsAt && {
				startsAt: post.fields?.startsAt,
			}),
			...(post.fields?.endsAt && {
				endsAt: post.fields?.endsAt,
			}),
			...(tags.length > 0 && { tags: tags.map((tag) => tag) }),
			...(product && { productType: product.type }),
			...(parentResources && {
				parentResources: parentResources.map((resource) => {
					return {
						id: resource.id,
						title: resource.fields?.title,
						slug: resource.fields?.slug,
						type: resource.type,
						visibility: resource.fields?.visibility,
						state: resource.fields?.state,
					}
				}),
			}),
		})

		if (!resource.success) {
			console.error('⚠️ Schema validation failed (skipping index):', {
				postId: post.id,
				error: resource.error.format(),
			})
			return
		}

		console.log('📝 Preparing document for upsert:', {
			id: resource.data.id,
			title: resource.data.title,
			slug: resource.data.slug,
			type: resource.data.type,
			action,
		})

		try {
			await typesenseWriteClient
				.collections(TYPESENSE_COLLECTION_NAME)
				.documents()
				.upsert({
					...resource.data,
					...(action === 'publish' && {
						published_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
					}),
					updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
				})
			console.log('✅ Successfully upserted document to TypeSense:', post.id)
		} catch (err: any) {
			console.error('⚠️ Failed to upsert document to TypeSense (non-fatal):', {
				postId: post.id,
				error: err.message || err,
				action,
			})
		}
	} catch (error: any) {
		// Catch any unexpected errors but don't throw
		console.error('⚠️ Unexpected error in TypeSense operation (non-fatal):', {
			error: error.message || error,
			stack: error.stack,
			postId: post.id,
		})
	}
}

export async function deletePostInTypeSense(postId: string) {
	try {
		console.log('🔄 Initializing TypeSense client for deletion:', {
			host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
			hasWriteKey: !!process.env.TYPESENSE_WRITE_API_KEY,
			collection: TYPESENSE_COLLECTION_NAME,
		})

		if (
			!process.env.TYPESENSE_WRITE_API_KEY ||
			!process.env.NEXT_PUBLIC_TYPESENSE_HOST
		) {
			console.error('⚠️ Missing TypeSense configuration, skipping deletion')
			return
		}

		let typesenseWriteClient = new Typesense.Client({
			nodes: [
				{
					host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
					port: 443,
					protocol: 'https',
				},
			],
			apiKey: process.env.TYPESENSE_WRITE_API_KEY,
			connectionTimeoutSeconds: 2,
		})

		try {
			await typesenseWriteClient
				.collections(TYPESENSE_COLLECTION_NAME)
				.documents(postId)
				.delete()
			console.log('✅ Successfully deleted document from TypeSense:', postId)
		} catch (err: any) {
			// Check if error is "Document not found" - that's actually fine
			if (err.message?.includes('Not Found') || err.httpStatus === 404) {
				console.log(
					'ℹ️ Document not found in TypeSense (already deleted):',
					postId,
				)
				return
			}
			console.error('⚠️ Failed to delete document from TypeSense:', {
				postId,
				error: err.message || err,
				httpStatus: err.httpStatus,
			})
			throw err
		}
	} catch (error: any) {
		console.error('⚠️ Unexpected error in TypeSense deletion:', {
			error: error.message || error,
			stack: error.stack,
			postId,
		})
		throw error
	}
}

export async function indexAllContentToTypeSense(
	resources: ContentResource[],
	deleteFirst = true,
) {
	let typesenseWriteClient = new Typesense.Client({
		nodes: [
			{
				host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
				port: 443,
				protocol: 'https',
			},
		],
		apiKey: process.env.TYPESENSE_WRITE_API_KEY!,
		connectionTimeoutSeconds: 2,
	})

	if (deleteFirst) {
		console.log('Deleting all documents')
		await typesenseWriteClient
			.collections(TYPESENSE_COLLECTION_NAME)
			.documents()
			.delete({
				filter_by: 'visibility:public',
			})
			.catch((err: any) => {
				console.error(err)
			})
	}

	const indexableResources = resources.filter(
		(resource) =>
			(resource?.fields?.state === 'published' &&
				resource.fields.visibility === 'public' &&
				(resource.type === 'post' ||
					resource.type === 'tutorial' ||
					resource.type === 'workshop')) ||
			resource.type === 'list',
	)

	const documents = indexableResources
		.map((resource) => {
			const parsedResource = TypesenseResourceSchema.safeParse({
				id: resource.id,
				title: resource?.fields?.title,
				slug: resource?.fields?.slug,
				description: resource?.fields?.body || resource?.fields?.description,
				type: resource.type,
				visibility: resource?.fields?.visibility,
				state: resource?.fields?.state,
				created_at_timestamp: resource.createdAt?.getTime(),
				published_at_timestamp: resource.updatedAt?.getTime(),
				updated_at_timestamp: resource.updatedAt?.getTime(),
			})

			if (!parsedResource.success) {
				console.error(
					'Failed to parse resource:',
					resource.id,
					parsedResource.error,
				)
				return null
			}

			return parsedResource.data
		})
		.filter((doc): doc is NonNullable<typeof doc> => doc !== null)

	if (documents.length === 0) {
		console.log('No documents to index')
		return
	}

	try {
		await typesenseWriteClient
			.collections(TYPESENSE_COLLECTION_NAME)
			.documents()
			.import(documents, { action: 'upsert' })

		console.log(`Successfully indexed ${documents.length} documents`)
	} catch (error) {
		console.error('Failed to index documents:', error)
	}
}

export async function getNearestNeighbour(
	documentId: string,
	numberOfNearestNeighborsToReturn: number,
	distanceThreshold: number,
	documentIdsToSkip?: string[],
) {
	if (
		!process.env.TYPESENSE_WRITE_API_KEY ||
		!process.env.NEXT_PUBLIC_TYPESENSE_HOST
	) {
		console.error(
			'⚠️ Missing TypeSense configuration, skipping retrieval operation',
		)
		return null
	}
	const typesenseWriteClient = new Typesense.Client({
		nodes: [
			{
				host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
				port: 443,
				protocol: 'https',
			},
		],
		apiKey: process.env.TYPESENSE_WRITE_API_KEY!,
		connectionTimeoutSeconds: 2,
	})
	let completedItemIds: string[] = []
	const { session } = await getServerAuthSession()
	if (session?.user?.id) {
		try {
			const progress = await db.query.resourceProgress.findMany({
				where: and(
					eq(resourceProgress.userId, session.user.id),
					isNotNull(resourceProgress.completedAt),
				),
				orderBy: desc(resourceProgress.completedAt),
				columns: {
					resourceId: true,
				},
			})
			completedItemIds = progress?.map((p: any) => p.resourceId) ?? []
		} catch (error) {
			console.error('Failed to fetch user progress:', error)
		}
	}

	const document: any = await typesenseWriteClient
		.collections(TYPESENSE_COLLECTION_NAME)
		.documents(documentId)
		.retrieve()

	if (!document) {
		console.debug(`Document ${documentId} not found in Typesense`)
		return null
	}

	if (!document.embedding || !Array.isArray(document.embedding)) {
		console.debug(`Document ${documentId} has no embedding in Typesense`)
		return null
	}

	const completedFilter =
		completedItemIds.length > 0
			? ` && id:!=[${[...completedItemIds, ...(documentIdsToSkip ?? [])].join(',')}]`
			: ''

	const searchRequests: { searches: MultiSearchRequestSchema[] } = {
		searches: [
			{
				collection: TYPESENSE_COLLECTION_NAME,
				q: '*',
				vector_query: `embedding:([${document.embedding.join(', ')}], k:${numberOfNearestNeighborsToReturn}, distance_threshold: ${distanceThreshold})`,
				exclude_fields: 'embedding',
				filter_by: `id:!=${documentId} && state:=published && type:=[post,list,article]${completedFilter}`,
			},
		],
	}
	const commonSearchParams: Partial<MultiSearchRequestSchema> = {}

	try {
		const { results } = await typesenseWriteClient.multiSearch.perform(
			searchRequests,
			commonSearchParams,
		)

		const parsedResults = z
			.object({
				hits: z.array(
					z.object({
						document: TypesenseResourceSchema,
					}),
				),
				facetCounts: z.array(z.number()).optional(),
				found: z.number().optional(),
				outOf: z.number().optional(),
				page: z.number().optional(),
				requestParams: z.any().optional(),
				searchCutoff: z.boolean().optional(),
				searchTimeMs: z.number().optional(),
			})
			.array()
			.parse(results)

		const randomIndex = Math.floor(
			Math.random() * (parsedResults[0]?.hits?.length ?? 0),
		)
		return parsedResults[0]?.hits[randomIndex]?.document ?? null
	} catch (e) {
		console.debug(e)
		return null
	}
}
