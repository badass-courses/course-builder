import z from 'zod'

import {
	ContentResourceSchema,
	productSchema,
} from '@coursebuilder/core/schemas'

export const ModuleSchema = ContentResourceSchema.merge(
	z.object({
		type: z.enum(['tutorial', 'workshop']),
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
			slug: z.string(),
			title: z.string().min(2).max(90),
			body: z.string().optional().nullable(),
			description: z.string().optional().nullable(),
			github: z.string().optional().nullable(),
			state: z
				.enum(['draft', 'published', 'archived', 'deleted'])
				.default('draft'),
			visibility: z.union([
				z.literal('public'),
				z.literal('private'),
				z.literal('unlisted'),
			]),
			coverImage: z
				.object({
					url: z.string().optional(),
					alt: z.string().optional(),
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
