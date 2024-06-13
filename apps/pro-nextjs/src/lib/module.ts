import z from 'zod'

export const ModuleSchema = z.object({
	type: z.enum(['tutorial', 'workshop']),
	id: z.string(),
	fields: z.object({
		slug: z.string(),
		title: z.string().min(2).max(90),
		body: z.string().optional().nullable(),
		description: z.string().optional().nullable(),
		visibility: z.union([
			z.literal('public'),
			z.literal('private'),
			z.literal('unlisted'),
		]),
		coverImage: z
			.object({
				url: z.string().optional().nullable(),
				alt: z.string().optional().nullable(),
			})
			.optional()
			.nullable(),
	}),
	resources: z.array(
		z.object({
			resourceId: z.string(),
			resourceOfId: z.string(),
			position: z.number(),
			resource: z.object({
				id: z.string(),
				type: z.enum([
					'lesson',
					'section',
					'videoResource',
					'linkResource',
					'exercise',
				]),
				fields: z.object({
					slug: z.string().optional().nullable(),
					title: z.string().min(2).max(90),
					body: z.string().optional().nullable(),
				}),
				resources: z.array(
					z.object({
						position: z.number(),
						resourceId: z.string(),
						resourceOfId: z.string(),
						resource: z.object({
							id: z.string(),
							type: z.enum(['lesson', 'videoResource', 'exercise', 'solution']),
							fields: z.object({
								slug: z.string().optional().nullable(),
								title: z.string().min(2).max(90),
								body: z.string().optional().nullable(),
							}),
							resources: z
								.array(
									z.object({
										position: z.number(),
										resourceId: z.string(),
										resourceOfId: z.string(),
										resource: z.object({
											id: z.string(),
											type: z.enum(['solution', 'videoResource']),
											fields: z.object({
												slug: z.string().optional().nullable(),
												title: z.string().min(2).max(90),
												body: z.string().optional().nullable(),
											}),
										}),
									}),
								)
								.optional()
								.nullable(),
						}),
					}),
				),
			}),
		}),
	),
})

export type Module = z.infer<typeof ModuleSchema>
