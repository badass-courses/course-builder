import { getNearestNeighbour } from '@/lib/typesense-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const typesenseRouter = createTRPCRouter({
	getNearestNeighbor: publicProcedure
		.input(
			z.object({
				documentId: z.string(),
				numberOfNearestNeighborsToReturn: z.number().optional().default(5),
				distanceThreshold: z.number().optional().default(1),
				documentIdsToSkip: z.array(z.string()).optional(),
			}),
		)
		.query(async ({ input }) => {
			return await getNearestNeighbour(
				input.documentId,
				input.numberOfNearestNeighborsToReturn,
				input.distanceThreshold,
				input.documentIdsToSkip,
			)
		}),
})
