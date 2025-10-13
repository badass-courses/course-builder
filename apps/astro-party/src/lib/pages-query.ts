'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { NewPage, Page, PageSchema } from '@/lib/pages'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

export async function getPages(): Promise<Page[]> {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const pages = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'page'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		orderBy: desc(contentResource.createdAt),
	})

	const pagesParsed = z.array(PageSchema).safeParse(pages)
	if (!pagesParsed.success) {
		console.error('Error parsing pages', pagesParsed)
		return []
	}

	return pagesParsed.data
}

export async function createPage(input: NewPage) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const newPageId = v4()

	await db.insert(contentResource).values({
		id: newPageId,
		type: 'page',
		fields: {
			title: input.fields.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.fields.title}~${guid()}`),
		},
		createdById: user.id,
	})

	const page = await getPage(newPageId)

	revalidateTag('pages', 'max')

	return page
}

export async function updatePage(input: Page) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentPage = await getPage(input.id)

	if (!currentPage) {
		return createPage(input)
	}

	let pageSlug = input.fields.slug

	if (input.fields.title !== currentPage?.fields.title) {
		const splitSlug = currentPage?.fields.slug.split('~') || ['', guid()]
		pageSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentPage.id,
		fields: {
			...currentPage.fields,
			...input.fields,
			slug: pageSlug,
		},
	})
}

export async function getPage(slugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const page = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'page'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
	})

	const pageParsed = PageSchema.safeParse(page)
	if (!pageParsed.success) {
		console.error('Error parsing page', pageParsed)
		return null
	}

	return pageParsed.data
}
