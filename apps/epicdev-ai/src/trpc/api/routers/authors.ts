import {
	assignAuthorToResource,
	createAuthor,
	deleteAuthor,
	findOrCreateUserAndAssignAuthorRole,
	getAuthor,
	getAuthors,
	getResourceAuthor,
	removeAuthorFromResource,
	updateAuthorName,
} from '@/lib/authors-query'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const authorsRouter = createTRPCRouter({
	/**
	 * Get all authors (users with author role)
	 */
	getAuthors: publicProcedure.query(async () => {
		return getAuthors()
	}),

	/**
	 * Get a single author by user ID
	 */
	getAuthor: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			return getAuthor(input.userId)
		}),

	/**
	 * Create an author by finding or creating a user by email, then assigning the "author" role.
	 * This function handles user lookup/creation and role assignment with Inngest logging.
	 */
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

	/**
	 * Update an author's name
	 */
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

	/**
	 * Delete an author by removing the "author" role from a user
	 * This reverts the user's role back to "user" (does NOT delete the user)
	 */
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

	/**
	 * Get the author assigned to a resource, with fallback to createdBy
	 */
	getResourceAuthor: publicProcedure
		.input(z.object({ resourceId: z.string() }))
		.query(async ({ input }) => {
			return getResourceAuthor(input.resourceId)
		}),

	/**
	 * Assign an author (user) to a resource
	 */
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

	/**
	 * Remove author assignment from a resource
	 * This will cause the resource to fallback to createdBy
	 */
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
