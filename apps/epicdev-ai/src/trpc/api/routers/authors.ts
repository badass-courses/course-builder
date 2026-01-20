import {
	assignAuthorToResource,
	createAuthor,
	deleteAuthor,
	findOrCreateUserAndAssignAuthorRole,
	getAssignedAuthorId,
	getAuthor,
	getAuthors,
	getKentUser,
	getResourceAuthor,
	removeAuthorFromResource,
	updateAuthorImage,
	updateAuthorName,
} from '@/lib/authors-query'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const authorsRouter = createTRPCRouter({
	getKentUser: publicProcedure.query(async () => {
		return getKentUser()
	}),

	getAuthors: publicProcedure.query(async () => {
		return getAuthors()
	}),

	getAuthor: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			return getAuthor(input.userId)
		}),

	createAuthor: publicProcedure
		.input(
			z.object({
				email: z.string().email('Please enter a valid email address'),
				name: z.string().min(1, 'Name is required'),
			}),
		)
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('manage', 'all')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			return findOrCreateUserAndAssignAuthorRole(input.email, input.name)
		}),

	updateAuthorName: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				name: z.string().min(1, 'Name is required'),
			}),
		)
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('manage', 'all')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			return updateAuthorName(input.userId, input.name)
		}),

	updateAuthorImage: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				image: z.union([
					z.string().url('Please enter a valid image URL'),
					z.null(),
				]),
			}),
		)
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('manage', 'all')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			return updateAuthorImage(input.userId, input.image)
		}),

	deleteAuthor: publicProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('manage', 'all')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			await deleteAuthor(input.userId)
			return { success: true }
		}),

	getAssignedAuthorId: publicProcedure
		.input(z.object({ resourceId: z.string() }))
		.query(async ({ input }) => {
			return getAssignedAuthorId(input.resourceId)
		}),

	getResourceAuthor: publicProcedure
		.input(z.object({ resourceId: z.string() }))
		.query(async ({ input }) => {
			try {
				return await getResourceAuthor(input.resourceId)
			} catch (error) {
				console.error('getResourceAuthor error:', error)
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message:
						error instanceof Error
							? error.message
							: 'Failed to get resource author',
				})
			}
		}),

	assignAuthorToResource: publicProcedure
		.input(
			z.object({
				resourceId: z.string(),
				userId: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('update', 'Content')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			await assignAuthorToResource(input.resourceId, input.userId)
			return { success: true }
		}),

	removeAuthorFromResource: publicProcedure
		.input(z.object({ resourceId: z.string() }))
		.mutation(async ({ input }) => {
			const { ability } = await getServerAuthSession()
			if (!ability.can('update', 'Content')) {
				throw new TRPCError({ code: 'UNAUTHORIZED' })
			}
			await removeAuthorFromResource(input.resourceId)
			return { success: true }
		}),
})
