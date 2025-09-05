'use server'

import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

import { triggerCohortEntitlementSync } from './cohort-update-trigger'
import { upsertPostToTypeSense } from './typesense-query'

export async function updateResource(input: {
	id: string
	type: string
	fields: Record<string, any>
	createdById: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		await log.error('resource.update.unauthorized', {
			resourceId: input.id,
			userId: user?.id,
		})
		throw new Error('Unauthorized')
	}

	const currentResource = await courseBuilderAdapter.getContentResource(
		input.id,
	)

	if (!currentResource) {
		await log.info('resource.create.started', {
			resourceId: input.id,
			type: input.type,
			userId: user.id,
		})

		const newResource = await courseBuilderAdapter.createContentResource(input)

		if (newResource) {
			try {
				await upsertPostToTypeSense(newResource, 'save')
				await log.info('resource.typesense.indexed', {
					resourceId: newResource.id,
					action: 'save',
				})
			} catch (error) {
				await log.error('resource.typesense.index.failed', {
					error: getErrorMessage(error),
					resourceId: newResource.id,
				})
			}
		}

		return newResource
	}

	let resourceSlug = input.fields.slug

	if (input.fields.title !== currentResource?.fields?.title) {
		const splitSlug = currentResource?.fields?.slug.split('~') || ['', guid()]
		resourceSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
		await log.info('resource.update.slug.changed', {
			resourceId: input.id,
			oldSlug: currentResource.fields?.slug,
			newSlug: resourceSlug,
			userId: user.id,
		})
	}

	const updatedResource =
		await courseBuilderAdapter.updateContentResourceFields({
			id: currentResource.id,
			fields: {
				...currentResource.fields,
				...input.fields,
				slug: resourceSlug,
				...(input.fields.image && {
					image: input.fields.image,
				}),
			},
		})

	if (updatedResource) {
		try {
			await upsertPostToTypeSense(updatedResource, 'save')
			await log.info('resource.update.typesense.success', {
				resourceId: input.id,
				action: 'save',
				userId: user.id,
			})
		} catch (error) {
			await log.error('resource.update.typesense.failed', {
				resourceId: input.id,
				error: getErrorMessage(error),
				userId: user.id,
			})
		}
	}

	await log.info('resource.update.success', {
		resourceId: input.id,
		userId: user.id,
		changes: Object.keys(input.fields),
	})

	// Trigger entitlement sync for cohorts
	if (input.type === 'cohort') {
		try {
			await triggerCohortEntitlementSync(input.id, {})
		} catch (error) {
			await log.error('cohort.entitlement_sync.trigger_failed', {
				cohortId: input.id,
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}

	return updatedResource
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message
	return String(error)
}
