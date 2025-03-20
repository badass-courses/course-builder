import { db } from '@/db'
import { section, sectionResource } from '@/db/schema'
import { createTRPCRouter, protectedProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export const sectionRouter = createTRPCRouter({
	// Get all sections for a content resource
	getSections: protectedProcedure
		.input(
			z.object({
				contentResourceId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Check ability to read this content
			if (!ctx.ability.can('read', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to read this content.',
				})
			}

			const sections = await db.query.section.findMany({
				where: eq(section.contentResourceId, input.contentResourceId),
				orderBy: section.position,
				with: {
					resources: {
						columns: {
							resourceId: true,
							position: true,
						},
						orderBy: sectionResource.position,
					},
				},
			})

			return sections
		}),

	// Create a new section
	createSection: protectedProcedure
		.input(
			z.object({
				contentResourceId: z.string(),
				title: z.string(),
				description: z.string().optional(),
				position: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			// Get max position if not provided
			let position = input.position ?? 0
			if (position === 0) {
				const maxPosition = await db
					.select({ max: sql`MAX(${section.position})` })
					.from(section)
					.where(eq(section.contentResourceId, input.contentResourceId))

				position = (maxPosition[0]?.max ?? 0) + 1
			}

			const [newSection] = await db
				.insert(section)
				.values({
					id: crypto.randomUUID(),
					contentResourceId: input.contentResourceId,
					title: input.title,
					description: input.description,
					position,
					createdById: ctx.session.user.id,
				})
				.returning()

			return newSection
		}),

	// Update a section
	updateSection: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				description: z.string().optional(),
				position: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			const [updatedSection] = await db
				.update(section)
				.set({
					title: input.title,
					description: input.description,
					position: input.position,
					updatedAt: new Date(),
				})
				.where(eq(section.id, input.id))
				.returning()

			return updatedSection
		}),

	// Delete a section
	deleteSection: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			// Delete section resources first
			await db
				.delete(sectionResource)
				.where(eq(sectionResource.sectionId, input.id))

			// Delete the section
			const [deletedSection] = await db
				.delete(section)
				.where(eq(section.id, input.id))
				.returning()

			return deletedSection
		}),

	// Add a resource to a section
	addResourceToSection: protectedProcedure
		.input(
			z.object({
				sectionId: z.string(),
				resourceId: z.string(),
				position: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			// Get max position if not provided
			let position = input.position ?? 0
			if (position === 0) {
				const maxPosition = await db
					.select({ max: sql`MAX(${sectionResource.position})` })
					.from(sectionResource)
					.where(eq(sectionResource.sectionId, input.sectionId))

				position = (maxPosition[0]?.max ?? 0) + 1
			}

			// First, check if relation already exists
			const existing = await db.query.sectionResource.findFirst({
				where: and(
					eq(sectionResource.sectionId, input.sectionId),
					eq(sectionResource.resourceId, input.resourceId),
				),
			})

			if (existing) {
				// Update the position
				const [updated] = await db
					.update(sectionResource)
					.set({
						position,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(sectionResource.sectionId, input.sectionId),
							eq(sectionResource.resourceId, input.resourceId),
						),
					)
					.returning()

				return updated
			}

			// Create a new relation
			const [newRelation] = await db
				.insert(sectionResource)
				.values({
					sectionId: input.sectionId,
					resourceId: input.resourceId,
					position,
				})
				.returning()

			return newRelation
		}),

	// Remove a resource from a section
	removeResourceFromSection: protectedProcedure
		.input(
			z.object({
				sectionId: z.string(),
				resourceId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			const [deleted] = await db
				.delete(sectionResource)
				.where(
					and(
						eq(sectionResource.sectionId, input.sectionId),
						eq(sectionResource.resourceId, input.resourceId),
					),
				)
				.returning()

			return deleted
		}),

	// Reorder resources in a section
	reorderSectionResources: protectedProcedure
		.input(
			z.object({
				sectionId: z.string(),
				resourceIds: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			// Update positions for all resources in batch
			const updates = await Promise.all(
				input.resourceIds.map(async (resourceId, index) => {
					const [updated] = await db
						.update(sectionResource)
						.set({
							position: index + 1, // positions start at 1
							updatedAt: new Date(),
						})
						.where(
							and(
								eq(sectionResource.sectionId, input.sectionId),
								eq(sectionResource.resourceId, resourceId),
							),
						)
						.returning()

					return updated
				}),
			)

			return updates
		}),

	// Reorder sections in a content resource
	reorderSections: protectedProcedure
		.input(
			z.object({
				contentResourceId: z.string(),
				sectionIds: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check ability to update this content
			if (!ctx.ability.can('update', 'Content')) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have permission to update this content.',
				})
			}

			// Update positions for all sections in batch
			const updates = await Promise.all(
				input.sectionIds.map(async (sectionId, index) => {
					const [updated] = await db
						.update(section)
						.set({
							position: index + 1, // positions start at 1
							updatedAt: new Date(),
						})
						.where(eq(section.id, sectionId))
						.returning()

					return updated
				}),
			)

			return updates
		}),
})
