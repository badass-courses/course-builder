import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { createTRPCRouter, protectedProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { and, eq, like } from 'drizzle-orm'
import { z } from 'zod'

export const contentResourcesRouter = createTRPCRouter({
	// Get all content resources
	getAllContent: protectedProcedure.query(async ({ ctx }) => {
		if (!ctx.ability.can('read', 'Content')) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You do not have permission to read content.',
			})
		}

		return db.query.contentResource.findMany({
			orderBy: (cr) => cr.title,
			columns: {
				id: true,
				title: true,
				type: true,
				status: true,
				createdAt: true,
			},
		})
	}),

	// Get a specific content resource
	getContent: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.ability.can('read', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to read content.',
				})
			}

			const content = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, input.id),
			})

			if (!content) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Content resource not found',
				})
			}

			return content
		}),

	// Get available resources for adding to sections
	getAvailableResources: protectedProcedure
		.input(
			z.object({
				contentResourceId: z.string(),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.ability.can('read', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to read content.',
				})
			}

			// Build WHERE condition
			let whereConditions = [] as any[]

			// Don't include the parent resource itself
			whereConditions.push(
				and(
					input.search
						? like(contentResource.title, `%${input.search}%`)
						: undefined,
					input.contentResourceId
						? eq(contentResource.id, input.contentResourceId).not()
						: undefined,
				),
			)

			const resources = await db.query.contentResource.findMany({
				where: and(...whereConditions.filter(Boolean)),
				orderBy: contentResource.title,
				columns: {
					id: true,
					title: true,
					description: true,
					type: true,
					createdAt: true,
				},
			})

			return resources
		}),
})
