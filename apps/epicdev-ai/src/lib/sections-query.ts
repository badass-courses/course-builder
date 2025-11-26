'use server'

import { revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import slugify from '@sindresorhus/slugify'
import { and, eq } from 'drizzle-orm'

/**
 * Fields that can be updated on a section resource
 */
export interface SectionFieldsUpdate {
	title?: string
	slug?: string
	description?: string
	github?: string
	gitpod?: string
}

/**
 * Updates a section's fields in the database
 * @param sectionId - The ID of the section to update
 * @param fields - The fields to update
 * @returns The updated section resource
 */
export async function updateSectionFields(
	sectionId: string,
	fields: SectionFieldsUpdate,
) {
	const { ability } = await getServerAuthSession()
	if (!ability.can('update', 'Content')) {
		throw new Error('Unauthorized')
	}

	const section = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, sectionId),
	})

	if (!section) {
		throw new Error(`Section with id ${sectionId} not found`)
	}

	if (section.type !== 'section') {
		throw new Error(`Resource ${sectionId} is not a section`)
	}

	// Auto-generate slug if title changed
	let newSlug = fields.slug
	if (fields.title && fields.title !== section.fields?.title && !fields.slug) {
		const slugSuffix = sectionId.split('-')[1] || sectionId.slice(-6)
		newSlug = `${slugify(fields.title)}~${slugSuffix}`
	}

	const updatedFields = {
		...section.fields,
		...fields,
		...(newSlug ? { slug: newSlug } : {}),
	}

	log.info('Updating section fields', {
		sectionId,
		fields: Object.keys(fields),
	})

	const result = await courseBuilderAdapter.updateContentResourceFields({
		id: sectionId,
		fields: updatedFields,
	})

	revalidateTag('section', 'max')

	return result
}

/**
 * Gets a section by ID
 * @param sectionId - The ID of the section
 * @returns The section resource or null
 */
export async function getSection(sectionId: string) {
	const section = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, sectionId),
	})

	if (!section || section.type !== 'section') {
		return null
	}

	return section
}

/**
 * Gets the section with github URL for a lesson, traversing up through nested sections
 * @param lessonId - The ID of the lesson
 * @returns The section resource with github URL, or the immediate parent section if none have github
 */
export async function getParentSectionForLesson(lessonId: string) {
	let currentResourceId = lessonId
	let immediateParentSection: any = null

	// Traverse up the hierarchy looking for a section with github
	while (currentResourceId) {
		const relation = await db.query.contentResourceResource.findFirst({
			where: eq(contentResourceResource.resourceId, currentResourceId),
			with: {
				resourceOf: true,
			},
		})

		if (!relation?.resourceOf) {
			break
		}

		// If parent is a section
		if (relation.resourceOf.type === 'section') {
			// Store the first section we find (immediate parent)
			if (!immediateParentSection) {
				immediateParentSection = relation.resourceOf
			}

			// If this section has github, return it
			if (relation.resourceOf.fields?.github) {
				return relation.resourceOf
			}

			// Otherwise, continue up the chain
			currentResourceId = relation.resourceOf.id
		} else {
			// Hit a non-section (workshop/tutorial), stop traversing
			break
		}
	}

	// Return immediate parent section even if no github found
	return immediateParentSection
}
