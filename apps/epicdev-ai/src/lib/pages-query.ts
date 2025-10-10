'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { NewPage, Page, PageSchema } from '@/lib/pages'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { v4 } from 'uuid'
import { z } from 'zod'

import { RESOURCE_UPDATED_EVENT } from '../inngest/events/resource-management'
import { inngest } from '../inngest/inngest.server'

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
		console.debug('Error parsing pages', pagesParsed.error)
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

export async function updatePage(
	input: Page,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
	revalidate = true,
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!input.id) {
		throw new Error('Page id is required')
	}

	const currentPage = await getPage(input.id)

	if (!currentPage) {
		await log.error('page.update.notfound', {
			pageId: input.id,
			userId: user?.id,
			action,
		})
		return createPage(input)
	}

	if (!user || !ability.can(action, subject('Content', currentPage))) {
		await log.error('page.update.unauthorized', {
			pageId: input.id,
			userId: user?.id,
			action,
		})
		throw new Error('Unauthorized')
	}

	let pageSlug = currentPage.fields.slug

	if (
		input.fields?.title !== currentPage.fields.title &&
		input.fields?.slug?.includes('~')
	) {
		const splitSlug = currentPage.fields.slug.split('~') || ['', guid()]
		pageSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
		await log.info('page.update.slug.changed', {
			pageId: input.id,
			oldSlug: currentPage.fields.slug,
			newSlug: pageSlug,
			userId: user.id,
		})
	} else if (input?.fields?.slug !== currentPage.fields.slug) {
		pageSlug = input?.fields?.slug || ''
		await log.info('page.update.slug.manual', {
			pageId: input.id,
			oldSlug: currentPage.fields.slug,
			newSlug: pageSlug,
			userId: user.id,
		})
	}

	try {
		const updatedPage = await courseBuilderAdapter.updateContentResourceFields({
			id: currentPage.id,
			fields: {
				...currentPage.fields,
				...input.fields,
				slug: pageSlug,
			},
		})

		if (!updatedPage) {
			await log.error('page.update.failed', {
				pageId: input.id,
				error: 'Failed to fetch updated page',
				action,
				userId: user.id,
			})
			console.error(`Failed to fetch updated page: ${currentPage.id}`)
			return null
		}

		await log.info('page.update.success', {
			pageId: input.id,
			action,
			userId: user.id,
			changes: Object.keys(input.fields || {}),
		})

		revalidate && revalidateTag('pages', 'max')

		try {
			console.log(
				`Dispatching ${RESOURCE_UPDATED_EVENT} for resource: ${updatedPage.id} (type: ${updatedPage.type})`,
			)
			const result = await inngest.send({
				name: RESOURCE_UPDATED_EVENT,
				data: {
					id: updatedPage.id,
					type: updatedPage.type,
				},
			})
			console.log(
				`Dispatched ${RESOURCE_UPDATED_EVENT} for resource: ${updatedPage.id} (type: ${updatedPage.type})`,
				result,
			)
		} catch (error) {
			console.error(`Error dispatching ${RESOURCE_UPDATED_EVENT}`, error)
		}

		return updatedPage
	} catch (error) {
		await log.error('page.update.failed', {
			pageId: input.id,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			action,
			userId: user.id,
		})
		throw error
	}
}

export async function getPage(slugOrId: string) {
	const page = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
			),
			eq(contentResource.type, 'page'),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							tags: {
								with: {
									tag: true,
								},
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const pageParsed = PageSchema.safeParse(page)
	if (!pageParsed.success) {
		console.debug('Error parsing page', pageParsed)
		return null
	}

	return pageParsed.data
}

export const getCachedPage = unstable_cache(
	async (slugOrId: string) => getPage(slugOrId),
	['page'],
	{ revalidate: 3600, tags: ['page'] },
)

function getErrorMessage(error: unknown) {
	if (isErrorWithMessage(error)) return error.message
	return String(error)
}

function getErrorStack(error: unknown) {
	if (isErrorWithStack(error)) return error.stack
	return undefined
}

function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: string }).message === 'string'
	)
}

function isErrorWithStack(error: unknown): error is { stack: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'stack' in error &&
		typeof (error as { stack: string }).stack === 'string'
	)
}
