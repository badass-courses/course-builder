import { courseBuilderAdapter } from '@/db'
import {
	attachVideoResourceToPost,
	detachVideoResourceFromPost,
	getAllVideoResources,
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
	getAll: protectedProcedure.query(async () => {
		return await getAllVideoResources()
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
