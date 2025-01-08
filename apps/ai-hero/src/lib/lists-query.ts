'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'

import { ListSchema } from './lists'

export async function createList(input: {
	title: string
	description?: string
}) {
	const { session, ability } = await getServerAuthSession()
	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const list = await courseBuilderAdapter.createContentResource({
		id: `list-${guid()}`,
		type: 'list',
		fields: {
			title: input.title,
			description: input.description,
			state: 'draft',
			visibility: 'unlisted',
			slug: `${slugify(input.title)}~${guid()}`,
		},
		createdById: session.user.id,
	})

	revalidateTag('lists')
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
		},
	})

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

	revalidateTag('lists')

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

	revalidateTag('lists')
}
