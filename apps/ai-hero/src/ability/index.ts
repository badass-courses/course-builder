import { Lesson } from '@/lib/lessons'
import type { Workshop } from '@/lib/workshops'
import {
	AbilityBuilder,
	createMongoAbility,
	type CreateAbility,
	type MongoAbility,
} from '@casl/ability'
import z from 'zod'

import {
	ContentResource,
	userSchema,
	type ContentResourceResource,
	type Purchase,
} from '@coursebuilder/core/schemas'

import {
	hasAvailableSeats,
	hasBulkPurchase,
	hasChargesForPurchases,
} from './purchase-validators'

export const UserSchema = userSchema.merge(
	z.object({
		role: z.enum(['admin', 'user', 'contributor']).nullish(),
		email: z.string().nullish(),
		fields: z.any(),
		entitlements: z
			.array(
				z.object({
					type: z.string(),
					expires: z.date().nullish(),
					metadata: z.record(z.any()),
				}),
			)
			.optional(),
		organizationRoles: z
			.array(
				z.object({
					organizationId: z.string(),
					name: z.string(),
				}),
			)
			.nullish(),
		memberships: z
			.array(
				z.object({
					id: z.string(),
					organizationId: z.string(),
				}),
			)
			.nullish(),
		roles: z
			.array(
				z.object({
					name: z.string(),
				}),
			)
			.nullish(),
	}),
)

export type User = z.infer<typeof UserSchema>

interface OrganizationBilling {
	organizationId: string
}

type Actions =
	| 'create'
	| 'read'
	| 'update'
	| 'delete'
	| 'manage'
	| 'view'
	| 'save'
	| 'publish'
	| 'archive'
	| 'unpublish'
	| 'invite'
	| 'transfer'

type Subjects =
	| 'RegionRestriction'
	| 'PendingOpenAccess'
	| 'Team'
	| 'Content'
	| 'User'
	| ContentResource
	| User
	| 'all'
	| 'Invoice'
	| 'Organization'
	| 'OrganizationMember'
	| OrganizationBilling
	| 'OrganizationBilling'
	| 'Discord'
	| 'Entitlement'

export type AppAbility = MongoAbility<[Actions, Subjects]>

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

type GetAbilityOptions = {
	user?: User
}

const hasRole = ({ user, role }: { user?: User | null; role: string }) => {
	return Boolean(user?.roles?.map((role) => role.name).includes(role))
}

/**
 * serializable CASL rules object
 *
 * @see https://casl.js.org/v6/en/guide/define-rules
 * @param options
 */
export function getAbilityRules(options: GetAbilityOptions = {}) {
	const { can, rules } = new AbilityBuilder<AppAbility>(createMongoAbility)

	if (options.user) {
		if (hasRole({ user: options.user, role: 'admin' })) {
			can('manage', 'all')
		}

		if (hasRole({ user: options.user, role: 'contributor' })) {
			can('create', 'Content')
			can('manage', 'Content', { createdById: { $eq: options.user.id } })
			can('save', 'Content', { createdById: { $eq: options.user.id } })
			can('publish', 'Content', { createdById: { $eq: options.user.id } })
			can('archive', 'Content', { createdById: { $eq: options.user.id } })
			can('unpublish', 'Content', { createdById: { $eq: options.user.id } })
		}

		if (hasRole({ user: options.user, role: 'reviewer' })) {
			can('read', 'Content')
		}

		can(['read', 'update'], 'User', { id: options.user.id })

		// Organization permissions
		if (options.user.organizationRoles) {
			options.user.organizationRoles.forEach(({ organizationId, name }) => {
				// Base permissions for all roles
				can('read', 'Organization', { organizationId: { $eq: organizationId } })

				if (name === 'owner') {
					can('manage', 'Organization', {
						organizationId: { $eq: organizationId },
					})
					can('manage', 'OrganizationMember', {
						organizationId: { $eq: organizationId },
					})
					can('manage', 'OrganizationBilling', {
						organizationId: { $eq: organizationId },
					})
					can('transfer', 'Organization', {
						organizationId: { $eq: organizationId },
					})
				}

				if (name === 'admin') {
					can(['create', 'read', 'update'], 'Organization', {
						organizationId: { $eq: organizationId },
					})
					can(['create', 'read', 'update', 'delete'], 'OrganizationMember', {
						organizationId: { $eq: organizationId },
					})
					can(['read', 'update'], 'OrganizationBilling', {
						organizationId: { $eq: organizationId },
					})
				}

				if (name === 'member' || name === 'learner') {
					can('read', 'Organization', {
						organizationId: { $eq: organizationId },
					})
					can('read', 'OrganizationMember', {
						organizationId: { $eq: organizationId },
					})
					can('delete', 'OrganizationMember', {
						organizationId: { $eq: organizationId },
						userId: { $eq: options.user?.id },
					})
				}
			})
		}
	}

	// can('read', 'Content', {
	// 	createdAt: { $lte: new Date() },
	// 	status: { $in: ['review', 'published'] },
	// })

	return rules
}

type ViewerAbilityInput = {
	user?: User | null
	subscriber?: any
	lesson?: Lesson
	module?: Workshop
	section?: ContentResource
	isSolution?: boolean
	country?: string
	purchases?: Purchase[]
	entitlementTypes?: {
		id: string
		name: string
	}[]
	allModuleResourceIds?: string[]
}

export function defineRulesForPurchases(
	viewerAbilityInput: ViewerAbilityInput,
) {
	const { can, rules } = new AbilityBuilder<AppAbility>(createMongoAbility)
	const {
		user,
		country,
		purchases = [],
		module,
		lesson,
		entitlementTypes,
		allModuleResourceIds,
	} = viewerAbilityInput

	if (user) {
		can('update', 'User', {
			id: user?.id,
		})
	}

	if (user) {
		if (hasRole({ user, role: 'admin' })) {
			can('manage', 'all')
		}

		if (hasRole({ user, role: 'contributor' })) {
			can('create', 'Content')
			can('manage', 'Content', { createdById: { $eq: user.id } })
		}

		if (hasRole({ user, role: 'reviewer' })) {
			can('read', 'Content')
		}

		can(['read', 'update'], 'User', { id: user.id })
	}

	if (user && module?.resourceProducts && purchases) {
		const modulePurchases = purchases.filter((purchase) =>
			module?.resourceProducts?.some(
				(product) => product.productId === purchase.productId,
			),
		)

		const userHasPurchaseWithAccess = modulePurchases.map((purchase) => {
			if (purchase?.bulkCouponId !== null) {
				return { valid: false, reason: 'bulk_purchase' }
			}

			if (purchase.status === 'Restricted' && purchase.country !== country) {
				return { valid: false, reason: 'region_restricted' }
			}

			// if (purchase.status === 'Restricted' && module.type === 'bonus') {
			// 	return { valid: false, reason: 'region_restricted' }
			// }

			if (
				purchase.status === 'Valid' ||
				(purchase.status === 'Restricted' && purchase.country === country) // && module.type !== 'bonus'
			) {
				return { valid: true }
			}
			return { valid: false, reason: 'unknown' }
		})

		if (
			userHasPurchaseWithAccess.some(
				(purchase) => purchase.reason === 'region_restricted',
			)
		) {
			can('read', 'RegionRestriction')
		}

		// LEGACY: this was used to grant access to the module and its resources
		// 		   but now we grant access via entitlements
		// if (userHasPurchaseWithAccess.some((purchase) => purchase.valid)) {
		// 	can('read', 'Content', {
		// 		id: { $in: [module.id, ...(allModuleResourceIds || [])] },
		// 	})
		// }
	}

	if (hasChargesForPurchases(purchases)) {
		can('read', 'Invoice')
	}

	if (hasBulkPurchase(purchases)) {
		can('read', 'Team')
	}

	if (hasAvailableSeats(purchases)) {
		can('invite', 'Team')
	}

	if (isFreelyVisible(viewerAbilityInput)) {
		can('read', 'Content')
	}

	if (canViewTip(viewerAbilityInput)) {
		can('read', 'Content')
	}

	if (canViewTalk(viewerAbilityInput)) {
		can('read', 'Content')
	}

	// if (canViewTutorial(viewerAbilityInput)) {
	// 	can('read', 'Content')
	// }

	if (hasRole({ user, role: 'admin' })) {
		can('manage', 'all')
		can('create', 'Content')
		can('read', 'Content')
	}

	const cohortEntitlementType = entitlementTypes?.find(
		(entitlement) => entitlement.name === 'cohort_content_access',
	)

	// check workshop in cohort
	if (user?.entitlements && module?.id) {
		user.entitlements.forEach((entitlement) => {
			if (entitlement.type === cohortEntitlementType?.id) {
				// Grant access to the workshop itself
				can('read', 'Content', {
					id: { $in: entitlement.metadata.contentIds },
				})

				// Check module start date
				const moduleStartsAt = module?.fields?.startsAt
				const moduleStarted =
					!moduleStartsAt || new Date(moduleStartsAt) < new Date()

				// If user has access to this specific workshop, grant access to lessons only if started
				if (entitlement.metadata.contentIds?.includes(module.id)) {
					if (moduleStarted) {
						can('read', 'Content', {
							id: { $in: allModuleResourceIds },
						})
					} else {
						can('read', 'PendingOpenAccess')
					}
				}
			}
		})
	}

	const workshopEntitlementType = entitlementTypes?.find(
		(entitlement) => entitlement.name === 'workshop_content_access',
	)

	// check self-paced workshop and its lessons
	if (user?.entitlements && module?.id) {
		user.entitlements.forEach((entitlement) => {
			if (entitlement.type === workshopEntitlementType?.id) {
				// Grant access to the workshop itself and its lessons
				can('read', 'Content', {
					id: { $in: entitlement.metadata.contentIds },
				})

				// If user has access to this specific workshop, grant access to lessons
				if (entitlement.metadata.contentIds?.includes(module.id)) {
					can('read', 'Content', {
						id: { $in: allModuleResourceIds },
					})
				}
			}
		})
	}

	// Grant access to lessons in sections with "free" tier and individual free lessons
	if (module?.resources) {
		const freeResourceIds: string[] = []

		module.resources.forEach((moduleResource) => {
			// Check if this is a section with free tier
			if (
				moduleResource.resource?.type === 'section' &&
				moduleResource.metadata?.tier === 'free'
			) {
				// Add all lessons in this free section
				moduleResource.resource.resources?.forEach(
					(sectionResource: ContentResourceResource) => {
						if (
							sectionResource.resource?.type === 'lesson' ||
							sectionResource.resource?.type === 'exercise' ||
							sectionResource.resource?.type === 'post'
						) {
							freeResourceIds.push(sectionResource.resource.id)
						}
					},
				)
			}

			// Check if this is a top-level lesson/exercise/post with free tier
			if (
				(moduleResource.resource?.type === 'lesson' ||
					moduleResource.resource?.type === 'exercise' ||
					moduleResource.resource?.type === 'post') &&
				moduleResource.metadata?.tier === 'free'
			) {
				freeResourceIds.push(moduleResource.resource.id)
			}
		})

		// Grant access to all free resources (lessons in free sections + individual free lessons)
		if (freeResourceIds.length > 0) {
			can('read', 'Content', {
				id: { $in: freeResourceIds },
			})
		}
	}

	// lesson check
	// TODO: validate
	const lessonModule = module?.resources?.find(
		(resource) => resource.resourceId === lesson?.id,
	)
	if (user?.entitlements && lessonModule) {
		const moduleStartsAt = module?.fields?.startsAt
		const moduleStarted =
			moduleStartsAt && new Date(moduleStartsAt) < new Date()

		user.entitlements.forEach((entitlement) => {
			if (entitlement.type === cohortEntitlementType?.id && moduleStarted) {
				can('read', 'Content', {
					id: { $in: allModuleResourceIds },
				})
			} else if (
				entitlement.type === cohortEntitlementType?.id &&
				!moduleStarted
			) {
				can('read', 'PendingOpenAccess')
			}
		})
	}

	return rules
}

// const canViewTutorial = ({ user, subscriber, module }: ViewerAbilityInput) => {
// 	const contentIsTutorial = module?.type === 'tutorial'
// 	const viewer = user || subscriber
// 	const emailIsNotRequiredToWatch =
// 		process.env.NEXT_PUBLIC_TUTORIALS_EMAIL_NOT_REQUIRED === 'true'

// 	return (contentIsTutorial && Boolean(viewer)) || emailIsNotRequiredToWatch
// }

const canViewTip = ({ lesson }: ViewerAbilityInput) => {
	return lesson?.type === 'tip'
}

const canViewTalk = ({ lesson }: ViewerAbilityInput) => {
	return lesson?.type === 'talk'
}

const isFreelyVisible = ({
	module,
	section,
	lesson,
	isSolution,
}: ViewerAbilityInput) => {
	const hasId = lesson && 'id' in lesson

	// return false if it is a 'Solution'
	if (isSolution || lesson?.type === 'solution' || !hasId) {
		return false
	}

	const lessons = z
		.array(z.object({ resourceId: z.string() }))
		.parse(section ? section.resources : module?.resources || [])

	const isFirstLesson =
		(lesson?.type === 'exercise' ||
			lesson?.type === 'explainer' ||
			lesson?.type === 'lesson') &&
		lesson.id === lessons?.[0]?.resourceId

	return false //isFirstLesson && lesson && !isSolution
}

/**
 * "compiled" ability generated from a bag of options passed in where the options determine what
 * `can` be performed as an ability
 *
 * any asynchronous logic should be handled in the construction of the options
 *
 * @see https://casl.js.org/v6/en/guide/intro
 * @param options
 */
export function getAbility(options: GetAbilityOptions = {}) {
	return createAppAbility(getAbilityRules(options))
}
