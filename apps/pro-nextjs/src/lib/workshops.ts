import z from 'zod'

export const NavigationResultSchema = z.object({
	workshop_id: z.string(),
	workshop_slug: z.string(),
	workshop_title: z.string(),
	workshop_image: z.string().optional().nullable(),
	section_or_lesson_id: z.string().nullable(),
	section_or_lesson_slug: z.string().nullable(),
	section_or_lesson_title: z.string().nullable(),
	section_or_lesson_position: z.number().nullable(),
	item_type: z.enum(['workshop', 'section', 'lesson']),
	lesson_id: z.string().nullable(),
	lesson_slug: z.string().nullable(),
	lesson_title: z.string().nullable(),
	lesson_position: z.number().nullable(),
})

export const NavigationResultSchemaArraySchema = z.array(NavigationResultSchema)

export const NavigationLessonSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
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

export type NavigationLesson = z.infer<typeof NavigationLessonSchema>
export type NavigationSection = z.infer<typeof NavigationSectionSchema>
export type NavigationResource = z.infer<typeof NavigationResourceSchema>
export type WorkshopNavigation = z.infer<typeof WorkshopNavigationSchema>
