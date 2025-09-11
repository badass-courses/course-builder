import { courseBuilderAdapter } from '@/db'
import {
	attachVideoResourceToPost,
	detachVideoResourceFromPost,
	getAllVideoResources,
	getPaginatedVideoResources,
} from '@/lib/video-resource-query'
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from '@/trpc/api/trpc'
import { z } from 'zod'

export const videoResourceRouter = createTRPCRouter({
	get: publicProcedure
		.input(
			z.object({
				videoResourceId: z.string().nullable().optional(),
			}),
		)
		.query(async ({ input }) => {
			return courseBuilderAdapter.getVideoResource(input.videoResourceId)
		}),
	getPaginated: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().min(1).max(100).default(20),
					cursor: z.string().optional(),
				})
				.optional()
				.default({}),
		)
		.query(async ({ input }) => {
			return await getPaginatedVideoResources(input.limit, input.cursor)
		}),
	attachToPost: protectedProcedure
		.input(
			z.object({
				postId: z.string(),
				videoResourceId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return attachVideoResourceToPost(input.postId, input.videoResourceId)
		}),
	detachFromPost: protectedProcedure
		.input(
			z.object({
				postId: z.string(),
				videoResourceId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			return detachVideoResourceFromPost(input.postId, input.videoResourceId)
		}),
})
