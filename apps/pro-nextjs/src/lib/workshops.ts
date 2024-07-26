import z from 'zod'

export const NavigationResultSchema = z.object({
	workshop_id: z.string(),
	workshop_slug: z.string(),
	workshop_title: z.string(),
	workshop_image: z.string().optional().nullable(),
	section_id: z.string(),
	section_slug: z.string(),
	section_title: z.string(),
	section_position: z.number(),
	lesson_id: z.string(),
	lesson_slug: z.string(),
	lesson_title: z.string(),
	lesson_position: z.number(),
})

export const NavigationResultSchemaArraySchema = z.array(NavigationResultSchema)

export const NavigationLessonSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
})

export const NavigationSectionSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	position: z.number(),
	lessons: z.array(NavigationLessonSchema),
})

export const WorkshopNavigationSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	coverImage: z.string().optional().nullable(),
	sections: z.array(NavigationSectionSchema).default([]),
})

export type NavigationLesson = z.infer<typeof NavigationLessonSchema>
export type NavigationSection = z.infer<typeof NavigationSectionSchema>
export type WorkshopNavigation = z.infer<typeof WorkshopNavigationSchema>
