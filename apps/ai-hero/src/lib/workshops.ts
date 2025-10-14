import z from 'zod'

import {
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'

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
	tier: z.string().optional().nullable(),
	resources: z.array(z.union([NavigationLessonSchema, NavigationPostSchema])),
})

export const NavigationResourceSchema = z.discriminatedUnion('type', [
	NavigationSectionSchema,
	NavigationLessonSchema,
	NavigationPostSchema,
])

export const CohortResourceSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.enum(['workshop', 'tutorial']),
	startsAt: z.string().datetime().nullable(),
})

export const CohortInfoSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	startsAt: z.string().datetime().nullable(),
	endsAt: z.string().datetime().nullable(),
	timezone: z.string(),
	cohortTier: z.enum(['standard', 'premium', 'vip']).nullable(),
	maxSeats: z.number().int().positive().nullable(),
	resources: z.array(CohortResourceSchema).optional().default([]),
})

export const WorkshopNavigationSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	coverImage: z.string().optional().nullable(),
	resources: z.array(NavigationResourceSchema),
	cohorts: z.array(CohortInfoSchema).optional().default([]),
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
	tier?: string | null
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
	tier: z.string().optional().nullable(),
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
			cohortId: z.null(),
			cohortSlug: z.null(),
			cohortTitle: z.null(),
			startsAt: z.null(),
			endsAt: z.null(),
			timezone: z.null(),
			cohortTier: z.null(),
			maxSeats: z.null(),
			resourceType: z.null(),
			resourcePosition: z.null(),
			tier: z.null(),
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
			cohortId: z.null(),
			cohortSlug: z.null(),
			cohortTitle: z.null(),
			startsAt: z.null(),
			endsAt: z.null(),
			timezone: z.null(),
			cohortTier: z.null(),
			maxSeats: z.null(),
			resourceType: z.null(),
			resourcePosition: z.null(),
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
			cohortId: z.null(),
			cohortSlug: z.null(),
			cohortTitle: z.null(),
			startsAt: z.null(),
			endsAt: z.null(),
			timezone: z.null(),
			cohortTier: z.null(),
			maxSeats: z.null(),
			resourceType: z.enum(['lesson', 'post']),
			resourcePosition: z.null(),
			tier: z.null(),
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
			cohortId: z.null(),
			cohortSlug: z.null(),
			cohortTitle: z.null(),
			startsAt: z.null(),
			endsAt: z.null(),
			timezone: z.null(),
			cohortTier: z.null(),
			maxSeats: z.null(),
			resourceType: z.null(),
			resourcePosition: z.null(),
			tier: z.null(),
		}),
	// Cohort row
	z
		.object({
			type: z.literal('cohort'),
		})
		.extend({
			id: z.null(),
			slug: z.null(),
			title: z.null(),
			coverImage: z.null(),
			position: z.null(),
			sectionId: z.null(),
			resourceId: z.null(),
			cohortId: z.string(),
			cohortSlug: z.string(),
			cohortTitle: z.string(),
			startsAt: z.string().datetime().nullable(),
			endsAt: z.string().datetime().nullable(),
			timezone: z.string(),
			cohortTier: z.enum(['standard', 'premium', 'vip']).nullable(),
			maxSeats: z.number().int().positive().nullable(),
			resourceType: z.null(),
			resourcePosition: z.null(),
			tier: z.null(),
		}),
	// Cohort resource row
	z
		.object({
			type: z.literal('cohort_resource'),
		})
		.extend({
			id: z.string(),
			slug: z.string(),
			title: z.string(),
			coverImage: z.null(),
			position: z.number(),
			sectionId: z.null(),
			resourceId: z.null(),
			cohortId: z.string(),
			cohortSlug: z.null(),
			cohortTitle: z.null(),
			startsAt: z.string().datetime().nullable(),
			endsAt: z.null(),
			timezone: z.null(),
			cohortTier: z.null(),
			maxSeats: z.null(),
			resourceType: z.enum(['workshop', 'tutorial']),
			resourcePosition: z.number(),
			tier: z.null(),
		}),
])

export const WorkshopFieldsSchema = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	subtitle: z.string().optional(),
	description: z.string().optional(),
	body: z.string().optional(),
	state: z.enum(['draft', 'published', 'archived', 'deleted']).default('draft'),
	startsAt: z.string().datetime().nullish(),
	endsAt: z.string().datetime().nullish(),
	timezone: z.string().default('America/Los_Angeles'),
	slug: z.string().min(1, { message: 'Slug is required' }),
	visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
	coverImage: z
		.object({
			url: z.string().optional(),
			alt: z.string().optional(),
		})
		.optional(),
	github: z.string().optional(),
	githubUrl: z.string().optional(),
})

/**
 * Define the workshop schema by extending ContentResourceSchema
 */
export const WorkshopSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('workshop'),
		id: z.string(),
		fields: WorkshopFieldsSchema,
	}),
)

/**
 * Workshop resource type definition
 */
export type Workshop = z.infer<typeof WorkshopSchema>

export type CohortResource = z.infer<typeof CohortResourceSchema>
export type CohortInfo = z.infer<typeof CohortInfoSchema>

export const MinimalWorkshopSchema = z.object({
	id: z.string(),
	type: z.literal('workshop'),
	fields: WorkshopFieldsSchema,
})

export type MinimalWorkshop = z.infer<typeof MinimalWorkshopSchema>
