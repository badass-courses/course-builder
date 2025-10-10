'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
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
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ListSchema, type ListUpdate } from './lists'
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
		await upsertPostToTypeSense(list, 'save')
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

	return ListSchema.parse(list)
}

export async function getListForPost(postId: string) {
	// optimized query that skips body fields
	const result = await db.execute(sql`
		SELECT
			list.id AS list_id,
			list.type AS list_type,
			list.fields AS list_fields,
			list.createdAt AS list_createdAt,
			list.updatedAt AS list_updatedAt,
			list.deletedAt AS list_deletedAt,
			list.createdById AS list_createdById,
			list.organizationId AS list_organizationId,
			list.createdByOrganizationMembershipId AS list_createdByOrganizationMembershipId,
			resources.id AS resource_id,
			resources.type AS resource_type,
			JSON_REMOVE(resources.fields, '$.body') AS resource_fields,
			relation.position AS resource_position
		FROM ${contentResourceResource} AS relation
		JOIN ${contentResource} AS list
			ON list.id = relation.resourceOfId
			AND list.type = 'list'
		LEFT JOIN ${contentResourceResource} AS list_resources
			ON list.id = list_resources.resourceOfId
		LEFT JOIN ${contentResource} AS resources
			ON resources.id = list_resources.resourceId
		WHERE relation.resourceId = ${postId}
		ORDER BY list_resources.position ASC
	`)

	if (result.rows.length === 0) {
		console.debug('No list found for this post')
		return null
	}

	const firstRow = result.rows[0] as any
	const list = {
		id: firstRow.list_id,
		type: firstRow.list_type,
		fields: firstRow.list_fields,
		createdAt: firstRow.list_createdAt,
		updatedAt: firstRow.list_updatedAt,
		deletedAt: firstRow.list_deletedAt,
		createdById: firstRow.list_createdById,
		organizationId: firstRow.list_organizationId,
		createdByOrganizationMembershipId:
			firstRow.list_createdByOrganizationMembershipId,
		resources: result.rows
			.filter((row: any) => row.resource_id)
			.map((row: any) => ({
				resource: {
					id: row.resource_id,
					type: row.resource_type,
					fields: row.resource_fields,
				},
				position: row.resource_position,
				resourceId: row.resource_id,
				resourceOfId: firstRow.list_id,
			}))
			.sort((a: any, b: any) => a.position - b.position),
	}

	return ListSchema.parse(list)
}

export async function addPostToList({
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
			resources: true,
		},
	})

	if (!list) throw new Error('List not found')

	await db.insert(contentResourceResource).values({
		resourceOfId: list.id,
		resourceId: postId,
		position: list.resources.length,
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
			resources: true,
		},
	})

	if (!list) throw new Error('List not found')

	await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceOfId, list.id),
				eq(contentResourceResource.resourceId, postId),
			),
		)
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

	revalidate && revalidateTag('lists', 'max')

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentList.id,
		fields: {
			...currentList.fields,
			...input.fields,
			slug: listSlug,
		},
	})
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
