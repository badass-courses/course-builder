import { getNearestNeighbour } from '@/lib/search-query'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { z } from 'zod'

export const typesenseRouter = createTRPCRouter({
	getNearestNeighbor: publicProcedure
		.input(
			z.object({
				documentId: z.string(),
				numberOfNearestNeighborsToReturn: z.number().optional().default(5),
				distanceThreshold: z.number().optional().default(1),
			}),
		)
		.query(async ({ input }) => {
			try {
				const result = await getNearestNeighbour(
					input.documentId,
					input.numberOfNearestNeighborsToReturn,
					input.distanceThreshold,
				)
				if (result) {
					return result
				} else {
					return null
				}
			} catch (error) {
				console.error(error)
				return null
			}
		}),
})
