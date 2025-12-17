'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
} from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { ListSchema, type ListUpdate } from './lists'
import { PostSchema } from './posts'
import { updatePost } from './posts-query'
import { deletePostInTypeSense, upsertPostToTypeSense } from './typesense-query'

export async function createList(input: {
	title: string
	listType: string
	description?: string
}) {
	const { session, ability } = await getServerAuthSession()
	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}
	const listGuid = guid()
	const newListId = `list_${listGuid}`

	await courseBuilderAdapter.createContentResource({
		id: newListId,
		type: 'list',
		fields: {
			title: input.title,
			description: input.description,
			type: input.listType,
			state: 'draft',
			visibility: 'unlisted',
			slug: `${slugify(input.title)}~${guid()}`,
		},
		createdById: session.user.id,
	})

	const list = await getList(newListId)

	try {
		list && (await upsertPostToTypeSense(list, 'save'))
	} catch (e) {
		console.error(`Failed to index ${newListId} in Typesense`, e)
	}

	revalidateTag('lists', 'max')
	return list
}

export async function getAllLists() {
	const lists = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'list'),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	return z.array(ListSchema).parse(lists)
}

export async function getList(listIdOrSlug: string) {
	const list = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					listIdOrSlug,
				),
				eq(contentResource.id, listIdOrSlug),
			),
			eq(contentResource.type, 'list'),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
	})

	const listParsed = ListSchema.safeParse(list)
	if (!listParsed.success) {
		console.debug('Error parsing list', listParsed)
		return null
	}

	return listParsed.data
}

export const getCachedListForPost = unstable_cache(
	async (post: ContentResource) => getListForPost(post),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getListForPost(post: ContentResource) {
	if (!post) {
		console.debug('No post provided')
		return null
	}

	// Find all relations where this post is a resource
	const listRelations = await db.query.contentResourceResource.findMany({
		where: eq(contentResourceResource.resourceId, post.id),
	})

	if (listRelations.length === 0) {
		console.debug('No list found for this post')
		return null
	}

	// Get all potential list IDs
	const listIds = listRelations.map((rel) => rel.resourceOfId)

	if (listIds.length === 0) {
		console.debug('No list IDs found')
		return null
	}

	// Find all lists that contain this post, filter to published and public
	const lists = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'list'),
			inArray(contentResource.id, listIds),
			eq(sql`JSON_EXTRACT(${contentResource.fields}, "$.state")`, 'published'),
			eq(
				sql`JSON_EXTRACT(${contentResource.fields}, "$.visibility")`,
				'public',
			),
		),
		orderBy: asc(contentResource.createdAt),
	})

	if (lists.length === 0) {
		console.debug('No published and public list found for this post')
		return null
	}

	// Get the oldest list (we know it exists because we checked length above)
	const oldestList = lists[0]
	if (!oldestList) {
		return null
	}

	// Get the list with its resources
	const list = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, oldestList.id),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
	})

	if (!list) {
		console.debug('List not found after query')
		return null
	}

	// Filter resources to only published ones and strip body fields
	const filteredResources = list.resources
		.filter((rel) => {
			const resource = rel.resource
			if (!resource?.fields || typeof resource.fields !== 'object') {
				return false
			}
			return 'state' in resource.fields && resource.fields.state === 'published'
		})
		.map((rel) => {
			const resource = rel.resource
			if (!resource) return rel

			// Strip body field for optimization
			const { body, ...fieldsWithoutBody } = resource.fields as Record<
				string,
				unknown
			>

			return {
				...rel,
				resource: {
					...resource,
					fields: fieldsWithoutBody,
				},
			}
		})

	const listWithFilteredResources = {
		...list,
		resources: filteredResources,
	}

	return ListSchema.parse(listWithFilteredResources)
}

export async function getMinimalListForNavigation(listIdOrSlug: string) {
	const result = await db.execute(sql`
        SELECT
            list.id,
            list.type,
            list.fields,
            list.createdAt,
            list.updatedAt,
            list.deletedAt,
            list.createdById,
            list.organizationId,
            list.createdByOrganizationMembershipId,
            resources.id AS resource_id,
            resources.type AS resource_type,
            JSON_OBJECT(
                'title', JSON_EXTRACT(resources.fields, '$.title'),
                'slug', JSON_EXTRACT(resources.fields, '$.slug'),
                'state', JSON_EXTRACT(resources.fields, '$.state')
            ) AS resource_fields,
            relation.position
        FROM ${contentResource} AS list
        LEFT JOIN ${contentResourceResource} AS relation
            ON list.id = relation.resourceOfId
        LEFT JOIN ${contentResource} AS resources
            ON resources.id = relation.resourceId
        WHERE (list.id = ${listIdOrSlug} OR JSON_EXTRACT(list.fields, '$.slug') = ${listIdOrSlug})
            AND list.type = 'list'
        ORDER BY relation.position ASC
    `)

	if (result.rows.length === 0) {
		return null
	}

	const firstRow = result.rows[0] as any
	const list = {
		id: firstRow.id,
		type: firstRow.type,
		fields: firstRow.fields,
		createdAt: firstRow.createdAt,
		updatedAt: firstRow.updatedAt,
		deletedAt: firstRow.deletedAt,
		createdById: firstRow.createdById,
		organizationId: firstRow.organizationId,
		createdByOrganizationMembershipId:
			firstRow.createdByOrganizationMembershipId,
		resources: result.rows
			.filter((row: any) => row.resource_id)
			.map((row: any) => ({
				resource: {
					id: row.resource_id,
					type: row.resource_type,
					fields: row.resource_fields,
				},
				position: row.position,
				resourceId: row.resource_id,
				resourceOfId: firstRow.id,
			})),
		tags: [], // Include empty tags array to satisfy ListSchema
	}

	return ListSchema.parse(list)
}

export async function addPostToList({
	postId,
	listId,
	metadata,
}: {
	postId: string
	listId: string
	metadata?: {
		tier?: 'standard' | 'premium' | 'vip'
	}
}) {
	const { ability } = await getServerAuthSession()
	if (!ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const list = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, listId),
		with: {
			resources: true,
		},
	})

	if (!list) throw new Error('List not found')

	await db.insert(contentResourceResource).values({
		resourceOfId: list.id,
		resourceId: postId,
		position: list.resources.length,
		metadata,
	})

	return db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, listId),
			eq(contentResourceResource.resourceId, postId),
		),
		with: {
			resource: true,
		},
	})
}

export async function removePostFromList({
	postId,
	listId,
}: {
	postId: string
	listId: string
}) {
	const { ability } = await getServerAuthSession()
	if (!ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const list = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, listId),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
							},
						},
					},
				},
			},
		},
	})

	if (!list) throw new Error('List not found')

	// Find the resource to remove - could be in top level or in a section
	const resourceToRemove = list.resources.find(
		(r) =>
			r.resourceId === postId ||
			r.resource.resources?.some(
				(childResource) => childResource.resourceId === postId,
			),
	)

	if (!resourceToRemove) throw new Error('Resource not found in list')

	// If the resource is directly in the list
	if (resourceToRemove.resourceId === postId) {
		await db
			.delete(contentResourceResource)
			.where(
				and(
					eq(contentResourceResource.resourceOfId, list.id),
					eq(contentResourceResource.resourceId, postId),
				),
			)
	} else {
		// If the resource is in a section
		await db
			.delete(contentResourceResource)
			.where(
				and(
					eq(contentResourceResource.resourceOfId, resourceToRemove.resourceId),
					eq(contentResourceResource.resourceId, postId),
				),
			)
	}
}

export async function updateList(
	input: ListUpdate,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
	revalidate = true,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const currentList = await getList(input.id)

	if (!currentList) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentList))) {
		throw new Error('Unauthorized')
	}

	let listSlug = currentList.fields.slug

	if (
		input.fields.title !== currentList.fields.title &&
		input.fields.slug.includes('~')
	) {
		const splitSlug = currentList?.fields.slug.split('~') || ['', guid()]
		listSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	} else if (input.fields.slug !== currentList.fields.slug) {
		listSlug = input.fields.slug
	}

	try {
		await upsertPostToTypeSense(currentList, action)
	} catch (e) {
		console.error('Failed to update post in Typesense', e)
	}

	const result = await courseBuilderAdapter.updateContentResourceFields({
		id: currentList.id,
		fields: {
			...currentList.fields,
			...input.fields,
			slug: listSlug,
		},
	})

	if (revalidate) {
		revalidateTag('lists', 'max')
		revalidatePath(`/lists/${listSlug}/edit`)
		revalidatePath(`/${listSlug}`)
	}

	return result
}

export async function deleteList(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const list = ListSchema.nullish().parse(
		await db.query.contentResource.findFirst({
			where: eq(contentResource.id, id),
			with: {
				resources: true,
			},
		}),
	)

	if (!list) {
		throw new Error(`Post with id ${id} not found.`)
	}

	if (!user || !ability.can('delete', subject('Content', list))) {
		throw new Error('Unauthorized')
	}

	if (list.resources.length > 0) {
		throw new Error('List has resources, please remove them first.')
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	await deletePostInTypeSense(list.id)

	revalidateTag('lists', 'max')
	revalidateTag(id, 'max')
	revalidatePath('/lists')

	return true
}

export async function updateListItemFields(
	itemId: string,
	fields: Record<string, any>,
) {
	const { ability } = await getServerAuthSession()
	if (!ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}
	const item = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, itemId),
	})

	if (!item) throw new Error('item not found')

	let result
	switch (item.type) {
		case 'post': {
			const parsedPost = PostSchema.parse(item)
			result = await updatePost(
				{
					id: item.id,
					fields: { ...parsedPost.fields, ...fields },
				},
				'save',
			)
			break
		}
		case 'list': {
			const parsedList = ListSchema.parse(item)
			result = await updateList(
				{
					id: item.id,
					fields: { ...parsedList.fields, ...fields },
					resources: parsedList.resources,
				},
				'save',
			)
			break
		}
		default: {
			result = await courseBuilderAdapter.updateContentResourceFields({
				id: item.id,
				fields: {
					...item.fields,
					...fields,
					...(fields.title && item.fields?.title !== fields.title
						? { slug: `${slugify(fields.title)}~${item.id.split('-')[1]}` }
						: {}),
				},
			})
			await upsertPostToTypeSense(result as any, 'save')
		}
	}

	return result
}
