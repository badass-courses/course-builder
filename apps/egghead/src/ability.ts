import {
	AbilityBuilder,
	createMongoAbility,
	type CreateAbility,
	type MongoAbility,
} from '@casl/ability'
import z from 'zod'

import { ContentResource } from '@coursebuilder/core/schemas'

export const UserSchema = z.object({
	role: z.string().optional(),
	id: z.string(),
	name: z.nullable(z.string().optional()),
	email: z.string().optional(),
	roles: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			description: z.string().nullable(),
			active: z.boolean(),
			createdAt: z.date().nullable(),
			updatedAt: z.date().nullable(),
			deletedAt: z.date().nullable(),
		}),
	),
})

export type User = z.infer<typeof UserSchema>

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
type Subjects = 'Content' | 'User' | ContentResource | User | 'all' | 'Invoice'

export type AppAbility = MongoAbility<[Actions, Subjects]>

export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

type GetAbilityOptions = {
	user?: {
		id: string
		role?: string
		roles: {
			id: string
			name: string
			description: string | null
			active: boolean
			createdAt?: Date | null
			updatedAt?: Date | null
			deletedAt?: Date | null
		}[]
	}
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
		if (options.user.roles.map((role) => role.name).includes('admin')) {
			can('manage', 'all')
		}

		if (options.user.roles.map((role) => role.name).includes('contributor')) {
			can('create', 'Content')
			can('manage', 'Content', { createdById: { $eq: options.user.id } })
			can('save', 'Content', { createdById: { $eq: options.user.id } })
			can('publish', 'Content', { createdById: { $eq: options.user.id } })
			can('archive', 'Content', { createdById: { $eq: options.user.id } })
			can('unpublish', 'Content', { createdById: { $eq: options.user.id } })
		}

		can('read', 'User', { id: options.user.id })
	}

	can('read', 'Content', {
		createdAt: { $lte: new Date() },
		status: { $in: ['review', 'published'] },
	})

	return rules
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
