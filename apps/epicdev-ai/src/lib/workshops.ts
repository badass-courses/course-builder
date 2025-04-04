import z from 'zod'

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
