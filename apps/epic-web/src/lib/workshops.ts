import z from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { PostTagsSchema } from './posts'

export const WorkshopStateSchema = z.enum([
	'draft',
	'published',
	'archived',
	'deleted',
])

export const WorkshopVisibilitySchema = z.enum([
	'public',
	'private',
	'unlisted',
])

export const WorkshopFieldsSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	subtitle: z.string().optional(),
	description: z.string().optional(),
	body: z.string().optional(),
	state: WorkshopStateSchema.default('draft'),
	startsAt: z.string().datetime().nullish(),
	endsAt: z.string().datetime().nullish(),
	timezone: z.string().default('America/Los_Angeles'),
	slug: z.string().min(1, { message: 'Slug is required' }),
	visibility: WorkshopVisibilitySchema.default('unlisted'),
	coverImage: z
		.object({
			url: z.string().optional(),
			alt: z.string().optional(),
		})
		.optional(),
	workshopApp: z
		.object({
			port: z.string().optional(),
			externalUrl: z.string().optional(),
		})
		.optional(),
	github: z.string().optional(),
})

/**
 * Workshop resource schema
 */
export const WorkshopSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('workshop'),
		id: z.string(),
		fields: WorkshopFieldsSchema,
		tags: PostTagsSchema,
	}),
)

export type Workshop = z.infer<typeof WorkshopSchema>

/**
 * Minimal workshop schema for list views
 */
export const MinimalWorkshopSchema = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	state: WorkshopStateSchema,
	visibility: WorkshopVisibilitySchema,
	coverImage: z
		.object({
			url: z.string().optional(),
			alt: z.string().optional(),
		})
		.optional(),
})

export type MinimalWorkshop = z.infer<typeof MinimalWorkshopSchema>

/**
 * Input schema for creating new workshops
 */
export const NewWorkshopInputSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	createdById: z.string(),
	subtitle: z.string().optional(),
	description: z.string().optional(),
	timezone: z.string().default('America/Los_Angeles'),
})

export type NewWorkshopInput = z.infer<typeof NewWorkshopInputSchema>

// Navigation schemas

export const NavigationLessonSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('lesson'),
	resources: z
		.array(
			z.object({
				id: z.string(),
				slug: z.string(),
				title: z.string(),
				type: z.literal('solution'),
			}),
		)
		.optional()
		.default([]),
})

export const NavigationPostSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('post'),
})

export const NavigationSectionSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('section'),
	resources: z.array(z.union([NavigationLessonSchema, NavigationPostSchema])),
})

export const NavigationResourceSchema = z.discriminatedUnion('type', [
	NavigationSectionSchema,
	NavigationLessonSchema,
	NavigationPostSchema,
])

export const WorkshopNavigationSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	coverImage: z.string().optional().nullable(),
	resources: z.array(NavigationResourceSchema),
})

export function findSectionIdForLessonSlug(
	navigation: WorkshopNavigation | null,
	lessonSlug?: string | null,
): string | null {
	for (const resource of navigation?.resources || []) {
		if (resource.type === 'section') {
			const lesson = resource.resources.find(
				(item) => 'slug' in item && item.slug === lessonSlug,
			)
			if (lesson) {
				return resource.id
			}
		} else if (resource.slug === lessonSlug) {
			// If it's a top-level lesson, return null or a special identifier
			return null // or return 'top-level' if you prefer
		}
	}
	return navigation?.resources[0]?.id || null // Lesson not found
}

export function getFirstLessonSlug(navigation: WorkshopNavigation | null) {
	if (!navigation) return null
	return navigation?.resources.flatMap((resource) => {
		if (resource.type === 'section') {
			return resource.resources
				.map((item) => ('slug' in item ? item.slug : null))
				.filter(Boolean)
		} else {
			return resource.slug
		}
	})[0]
}

export type NavigationLesson = z.infer<typeof NavigationLessonSchema>
export type NavigationSection = z.infer<typeof NavigationSectionSchema>
export type NavigationResource = z.infer<typeof NavigationResourceSchema>
export type WorkshopNavigation = z.infer<typeof WorkshopNavigationSchema>

// Raw data types for workshop navigation

export type WorkshopRaw = {
	id: string
	slug: string
	title: string
	coverImage: string | null
}

export type SectionRaw = {
	id: string
	slug: string
	title: string
	position: number
}

export type ResourceRaw = {
	id: string
	slug: string
	title: string
	position: number
	type: 'lesson' | 'post'
	sectionId: string | null
}

export type SolutionRaw = {
	id: string
	slug: string
	title: string
	resourceId: string
}

// Schema for raw database results
export const WorkshopRawSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	coverImage: z.string().nullable(),
})

export const SectionRawSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
})

export const ResourceRawSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.enum(['lesson', 'post']),
	sectionId: z.string().nullable(),
})

export const SolutionRawSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	resourceId: z.string(),
})

// Schema for combined query result rows
export const QueryResultRowSchema = z.discriminatedUnion('type', [
	// Workshop row - has coverImage
	z
		.object({
			type: z.literal('workshop'),
		})
		.extend({
			...WorkshopRawSchema.shape,
			position: z.null(),
			sectionId: z.null(),
			resourceId: z.null(),
		}),
	// Section row
	z
		.object({
			type: z.literal('section'),
		})
		.extend({
			...SectionRawSchema.shape,
			coverImage: z.null(), // Sections don't have coverImage
			sectionId: z.null(),
			resourceId: z.null(),
		}),
	// Resource row (lesson/post)
	z
		.object({
			type: z.literal('resource'),
		})
		.extend({
			// Only use the common fields from ResourceRawSchema, as 'type' is in the discriminator
			id: z.string(),
			slug: z.string(),
			title: z.string(),
			position: z.number(),
			coverImage: z.null(), // Resources don't have coverImage
			sectionId: z.string().nullable(),
			resourceId: z.null(),
		}),
	// Solution row
	z
		.object({
			type: z.literal('solution'),
		})
		.extend({
			...SolutionRawSchema.shape,
			coverImage: z.null(), // Solutions don't have coverImage
			position: z.null(),
			sectionId: z.null(),
		}),
])
