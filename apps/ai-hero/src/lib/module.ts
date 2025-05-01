import z from 'zod'

import {
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'

export const ModuleSchema = ContentResourceSchema.merge(
	z.object({
		type: z.literal('workshop'),
		id: z.string(),
		resourceProducts: z
			.array(
				z.object({
					resourceId: z.string(),
					productId: z.string(),
					product: productSchema,
				}),
			)
			.optional()
			.nullable(),
		fields: z.object({
			title: z.string().min(1, { message: 'Title is required' }),
			subtitle: z.string().optional(),
			description: z.string().optional(),
			body: z.string().optional(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			startsAt: z.string().datetime().optional(),
			endsAt: z.string().datetime().optional(),
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
						'post',
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
								type: z.enum([
									'lesson',
									'videoResource',
									'exercise',
									'solution',
									'post',
								]),
								fields: z.object({
									slug: z.string().optional().nullable(),
									title: z.string().min(2).max(90).optional().nullable(),
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
													title: z
														.string()
														.min(2)
														.max(90)
														.optional()
														.nullable(),
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
	}),
)

export type Module = z.infer<typeof ModuleSchema>
