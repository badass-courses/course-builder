import { env } from '@/env.mjs'
import Typesense from 'typesense'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { Post, PostAction } from './posts'
// import { getPostTags } from './posts-query'
import { TypesenseResourceSchema, typesenseWriteClient } from './typesense'

export async function indexAllContentToTypeSense(
	resources: ContentResource[],
	deleteFirst = true,
) {
	if (deleteFirst) {
		console.log('Deleting all documents')
		await typesenseWriteClient
			.collections(env.TYPESENSE_COLLECTION_NAME!)
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
			resource?.fields?.state === 'published' &&
			resource.fields.visibility === 'public' &&
			(resource.type === 'post' ||
				resource.type === 'tutorial' ||
				resource.type === 'workshop'),
	)

	const documents = indexableResources
		.map((resource) => {
			const parsedResource = TypesenseResourceSchema.safeParse({
				id: resource.id,
				title: resource?.fields?.title,
				slug: resource?.fields?.slug,
				description: resource?.fields?.description || '',
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
			.collections(env.TYPESENSE_COLLECTION_NAME!)
			.documents()
			.import(documents, { action: 'upsert' })

		console.log(`Successfully indexed ${documents.length} documents`)
	} catch (error) {
		console.error('Failed to index documents:', error)
	}
}

export async function upsertPostToTypeSense(post: Post, action: PostAction) {
	let client = new Typesense.Client({
		nodes: [
			{
				host: env.NEXT_PUBLIC_TYPESENSE_HOST,
				port: 443,
				protocol: 'https',
			},
		],
		apiKey: env.TYPESENSE_WRITE_API_KEY,
		connectionTimeoutSeconds: 2,
	})
	const shouldIndex =
		post.fields.state === 'published' && post.fields.visibility === 'public'

	if (!shouldIndex) {
		await client
			.collections(env.TYPESENSE_COLLECTION_NAME)
			.documents(String(post.id))
			.delete()
			.catch((err: any) => {
				console.error(err)
			})
	} else {
		// const tags = await getPostTags(post.id)
		const now = Date.now()
		const resource = TypesenseResourceSchema.safeParse({
			id: post.id,
			title: post.fields.title,
			slug: post.fields.slug,
			description: post.fields.body,
			type: post.type,
			visibility: post.fields.visibility,
			state: post.fields.state,
			created_at_timestamp: post.createdAt?.getTime() ?? Date.now(),
			// _tags: tags.map((tag) => tag.fields.name),
		})

		if (!resource.success) {
			console.error('Schema validation error:', resource.error)
			return
		}

		console.log('resource', resource.data)

		await client
			.collections(env.TYPESENSE_COLLECTION_NAME)
			.documents()
			.upsert({
				...resource.data,
				...(action === 'publish' && {
					published_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
				}),
				updated_at_timestamp: post.updatedAt?.getTime() ?? Date.now(),
			})
			.catch((err: any) => {
				console.error(err)
			})
	}
}

export async function deletePostInTypeSense(postId: string) {
	await typesenseWriteClient
		.collections(env.TYPESENSE_COLLECTION_NAME)
		.documents(postId)
		.delete()
		.catch((err: any) => {
			console.error(err)
		})
}
