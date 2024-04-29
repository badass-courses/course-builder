'use server'

import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { and, asc, eq, gt } from 'drizzle-orm'

import type { ContentResource } from '@coursebuilder/core/types'

export async function getNextResource(
	currentResourceId: string,
): Promise<ContentResource | null | undefined> {
	// First, get the current resource relation to identify its position and the parent resource
	const currentResourceRelation =
		await db.query.contentResourceResource.findFirst({
			where: eq(contentResourceResource.resourceId, currentResourceId),
			columns: {
				position: true,
				resourceOfId: true,
			},
		})

	if (!currentResourceRelation) {
		console.error('Current resource relation not found')
		return null
	}

	// Attempt to find the next resource within the same collection by position
	let nextResourceRelation = await db.query.contentResourceResource.findFirst({
		where: and(
			eq(
				contentResourceResource.resourceOfId,
				currentResourceRelation.resourceOfId,
			),
			gt(contentResourceResource.position, currentResourceRelation.position),
		),
		orderBy: asc(contentResourceResource.position),
	})

	if (!nextResourceRelation) {
		// Check for resources outside of sections
		const nextResourceOutsideSection = await db.query.contentResource.findFirst(
			{
				where: and(
					gt(contentResource.id, currentResourceRelation.resourceOfId),
					eq(contentResource.type, 'resource'),
				),
				orderBy: asc(contentResource.id),
				with: {
					resources: true,
				},
			},
		)

		if (nextResourceOutsideSection) {
			return nextResourceOutsideSection
		}

		// Fetch the ID of the next section
		const nextSection = await db.query.contentResource.findFirst({
			where: and(
				gt(contentResource.id, currentResourceRelation.resourceOfId),
				eq(contentResource.type, 'section'),
			),
			orderBy: asc(contentResource.id),
		})

		if (!nextSection) {
			console.error('No subsequent section found')
			return null
		}

		// Retrieve the first resource of the next section
		nextResourceRelation = await db.query.contentResourceResource.findFirst({
			where: eq(contentResourceResource.resourceOfId, nextSection.id),
			orderBy: asc(contentResourceResource.position),
		})
	}

	if (!nextResourceRelation) {
		console.error('No resource found in the next section')
		return null
	}

	// Retrieve the full details of the next resource
	const nextResource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, nextResourceRelation.resourceId),
		with: {
			resources: true,
		},
	})

	return nextResource
}
