import z from 'zod'

export const NavigationResultSchema = z.object({
	workshop_id: z.string(),
	workshop_slug: z.string(),
	workshop_title: z.string(),
	workshop_image: z.string().optional().nullable(),
	section_id: z.string().nullable(),
	section_slug: z.string().nullable(),
	section_title: z.string().nullable(),
	section_position: z.number().nullable(),
	item_type: z.enum(['workshop', 'section', 'lesson']),
	lesson_id: z.string().nullable(),
	lesson_slug: z.string().nullable(),
	lesson_title: z.string().nullable(),
	lesson_position: z.number().nullable(),
	isFreeToView: z.number().optional().nullable(),
})

export const NavigationResultSchemaArraySchema = z.array(NavigationResultSchema)

export const NavigationLessonSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	isFreeToView: z.boolean().optional().nullable(),
	type: z.literal('lesson'),
})

export const NavigationSectionSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	type: z.literal('section'),
	lessons: z.array(NavigationLessonSchema),
})

export const NavigationResourceSchema = z.discriminatedUnion('type', [
	NavigationSectionSchema,
	NavigationLessonSchema,
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
			const lesson = resource.lessons.find(
				(lesson) => lesson.slug === lessonSlug,
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
			return resource.lessons.map((lesson) => lesson.slug)
		} else {
			return resource.slug
		}
	})[0]
}

export type NavigationLesson = z.infer<typeof NavigationLessonSchema>
export type NavigationSection = z.infer<typeof NavigationSectionSchema>
export type NavigationResource = z.infer<typeof NavigationResourceSchema>
export type WorkshopNavigation = z.infer<typeof WorkshopNavigationSchema>
