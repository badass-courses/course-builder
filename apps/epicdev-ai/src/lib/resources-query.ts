'use server'

import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'

import { RESOURCE_UPDATED_EVENT } from '../inngest/events/resource-management'
import { inngest } from '../inngest/inngest.server'

export async function updateResource(input: {
	id: string
	type: string
	fields: Record<string, any>
	createdById: string
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	if (!user || !ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const currentResource = await courseBuilderAdapter.getContentResource(
		input.id,
	)

	if (!currentResource) {
		console.warn(`Resource with id ${input.id} not found for update.`)
		return null
	}

	let resourceSlug = input.fields.slug

	if (input.fields.title !== currentResource?.fields?.title) {
		const splitSlug = currentResource?.fields?.slug.split('~') || ['', guid()]
		resourceSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	}

	const updatedFields = {
		...currentResource.fields,
		...input.fields,
		slug: resourceSlug,
		...(input.fields.image && {
			image: input.fields.image,
		}),
	}

	await courseBuilderAdapter.updateContentResourceFields({
		id: currentResource.id,
		fields: updatedFields,
	})

	const updatedResource = await courseBuilderAdapter.getContentResource(
		currentResource.id,
	)

	if (!updatedResource) {
		console.error(`Failed to fetch updated resource: ${currentResource.id}`)
		return null
	}

	try {
		console.log(
			`Dispatching ${RESOURCE_UPDATED_EVENT} for resource: ${updatedResource.id} (type: ${updatedResource.type})`,
		)
		await inngest.send({
			name: RESOURCE_UPDATED_EVENT,
			data: {
				id: updatedResource.id,
				type: updatedResource.type,
			},
		})
	} catch (error) {
		console.error(`Error dispatching ${RESOURCE_UPDATED_EVENT}`, error)
	}

	return updatedResource
}
