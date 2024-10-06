import { z } from 'zod'

export const MuxAssetSchema = z.object({
	id: z.string(),
	status: z.string(),
	duration: z.number().optional(),
	passthrough: z.string().optional(),
	tracks: z
		.array(z.object({ type: z.string(), id: z.string() }))
		.optional()
		.nullable(),
	playback_ids: z.array(
		z.object({
			id: z.string(),
			policy: z.string(),
		}),
	),
})
