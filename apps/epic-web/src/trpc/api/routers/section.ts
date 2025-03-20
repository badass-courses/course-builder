import { db } from '@/db'
import { section, sectionResource } from '@/db/schema'
import { createTRPCRouter, protectedProcedure } from '@/trpc/api/trpc'
import { TRPCError } from '@trpc/server'
import { and, eq, max } from 'drizzle-orm'
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
					.select({
						maxPosition: max(section.position),
					})
					.from(section)
					.where(eq(section.contentResourceId, input.contentResourceId))

				position = (maxPosition[0]?.maxPosition || 0) + 1
			}

			// Insert the new section
			await db.insert(section).values({
				id: crypto.randomUUID(),
				contentResourceId: input.contentResourceId,
				title: input.title,
				description: input.description,
				position,
				createdById: ctx.session.user.id,
			})

			// Fetch the newly created section
			const newSection = await db.query.section.findFirst({
				where: and(
					eq(section.contentResourceId, input.contentResourceId),
					eq(section.title, input.title),
				),
				orderBy: section.createdAt,
				desc: true,
			})

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

			// Update the section
			await db
				.update(section)
				.set({
					title: input.title,
					description: input.description,
					position: input.position,
					updatedAt: new Date(),
				})
				.where(eq(section.id, input.id))

			// Fetch the updated section
			const updatedSection = await db.query.section.findFirst({
				where: eq(section.id, input.id),
			})

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

			// Get the section before deleting it
			const sectionToDelete = await db.query.section.findFirst({
				where: eq(section.id, input.id),
			})

			if (!sectionToDelete) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Section not found.',
				})
			}

			// Delete section resources first
			await db
				.delete(sectionResource)
				.where(eq(sectionResource.sectionId, input.id))

			// Delete the section
			await db.delete(section).where(eq(section.id, input.id))

			return sectionToDelete
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
					.select({
						maxPosition: max(sectionResource.position),
					})
					.from(sectionResource)
					.where(eq(sectionResource.sectionId, input.sectionId))

				position = (maxPosition[0]?.maxPosition || 0) + 1
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
				await db
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

				// Fetch the updated relation
				const updated = await db.query.sectionResource.findFirst({
					where: and(
						eq(sectionResource.sectionId, input.sectionId),
						eq(sectionResource.resourceId, input.resourceId),
					),
				})

				return updated
			}

			// Create a new relation
			await db.insert(sectionResource).values({
				sectionId: input.sectionId,
				resourceId: input.resourceId,
				position,
			})

			// Fetch the newly created relation
			const newRelation = await db.query.sectionResource.findFirst({
				where: and(
					eq(sectionResource.sectionId, input.sectionId),
					eq(sectionResource.resourceId, input.resourceId),
				),
			})

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

			// Get the relation before deleting it
			const relationToDelete = await db.query.sectionResource.findFirst({
				where: and(
					eq(sectionResource.sectionId, input.sectionId),
					eq(sectionResource.resourceId, input.resourceId),
				),
			})

			if (!relationToDelete) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Resource not found in this section.',
				})
			}

			// Delete the relation
			await db
				.delete(sectionResource)
				.where(
					and(
						eq(sectionResource.sectionId, input.sectionId),
						eq(sectionResource.resourceId, input.resourceId),
					),
				)

			return relationToDelete
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
					await db
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

					return { sectionId: input.sectionId, resourceId, position: index + 1 }
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
					await db
						.update(section)
						.set({
							position: index + 1, // positions start at 1
							updatedAt: new Date(),
						})
						.where(eq(section.id, sectionId))

					// Fetch the updated section
					const updated = await db.query.section.findFirst({
						where: eq(section.id, sectionId),
					})

					return updated
				}),
			)

			return updates.filter(Boolean)
		}),
})
