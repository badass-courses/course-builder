'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { z } from 'zod'

const NewResourceSchema = z.object({
	type: z.string(),
	title: z.string().min(2).max(90),
})

type NewResource = z.infer<typeof NewResourceSchema>

export async function createResource(input: NewResource) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const hash = guid()
	const newResourceId = slugify(`${input.type}~${hash}`)

	const newResource = {
		id: newResourceId,
		type: input.type,
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'unlisted',
			slug: slugify(`${input.title}~${hash}`),
		},
		createdById: user.id,
	}

	await db.insert(contentResource).values(newResource)

	return newResource
}
