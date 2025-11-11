import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { z } from 'zod'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import {
	ContentResourceSchema,
	ResourceStateSchema,
	ResourceVisibilitySchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import {
	CommerceProps,
	PricingData,
	type PricingOptions,
} from '@coursebuilder/core/types'

import { WorkshopSchema } from './workshops'

/**
 * @description Schema for cohort-based learning experiences
 */
export const CohortSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string().min(2).max(90),
			description: z.string().optional(),
			slug: z.string(),
			body: z.string().optional(),
			state: ResourceStateSchema.default('draft'),
			visibility: ResourceVisibilitySchema.default('unlisted'),
			startsAt: z.string().datetime().optional(),
			endsAt: z.string().datetime().optional(),
			timezone: z.string().default('America/Los_Angeles'),
			cohortTier: z.enum(['standard', 'premium', 'vip']).optional(),
			maxSeats: z.number().int().positive().optional(),
			discordRoleId: z.string().optional(),
			image: z.string().optional(),
			socialImage: z
				.object({
					type: z.string(),
					url: z.string().url(),
				})
				.optional(),
		}),
	}),
)

export type Cohort = z.infer<typeof CohortSchema>

/**
 * @description Schema for validating a cohort before publishing
 */
export const PublishableCohortSchema = CohortSchema.extend({
	fields: z.object({
		title: z.string().min(2).max(90),
		description: z.string(),
		slug: z.string(),
		body: z.string(),
		state: z.literal('published'),
		visibility: ResourceVisibilitySchema,
		startsAt: z.string().datetime(),
		endsAt: z.string().datetime(),
		timezone: z.string(),
		cohortTier: z.enum(['standard', 'premium', 'vip']),
		maxSeats: z.number().int().positive(),
		discordRoleId: z.string().optional(),
		image: z.string().url().optional(),
		socialImage: z
			.object({
				type: z.string(),
				url: z.string().url(),
			})
			.optional(),
	}),
})

/**
 * @description Type guard to check if a resource is a cohort
 */
export const isCohort = (resource: { type: string }): boolean => {
	return resource.type === 'cohort'
}

/**
 * @description Helper to create a new cohort with default values
 */
export const createCohort = (input: Partial<Cohort>): Cohort => {
	return {
		...input,
		type: 'cohort',
		fields: {
			...input.fields,
			state: input.fields?.state ?? 'draft',
			visibility: input.fields?.visibility ?? 'unlisted',
			timezone: input.fields?.timezone ?? 'America/Los_Angeles',
		},
	} as Cohort
}

/**
 * @description Validates if a cohort can be published
 * @throws {Error} if validation fails
 */
export const validateCohortForPublishing = (cohort: Cohort): void => {
	const result = PublishableCohortSchema.safeParse(cohort)
	if (!result.success) {
		throw new Error(
			`Cohort cannot be published. Missing required fields: ${result.error.message}`,
		)
	}
}

export type CohortTier = 'standard' | 'premium' | 'vip'

export type CohortAccess = {
	tier: CohortTier
	contentIds: string[]
	expiresAt: Date | null
	discordRoleId?: string
}

/**
 * Shared props for cohort pages and pricing components
 */
export type CohortPageProps = {
	cohort: Cohort
	quantityAvailable: number
	totalQuantity: number
	purchaseCount: number
	product?: Product
	mdx?: MDXRemoteSerializeResult
	hasPurchasedCurrentProduct?: boolean
	availableBonuses: any[]
	existingPurchase?: (Purchase & { product?: Product | null }) | null
	purchases?: Purchase[]
	userId?: string
	pricingDataLoader: Promise<PricingData>
	pricingWidgetOptions?: Partial<PricingOptions>
} & CommerceProps
