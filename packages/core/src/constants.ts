export const ROLES = {
	OWNER: 'owner',
	LEARNER: 'learner',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PROVIDERS = {
	STRIPE: 'stripe',
} as const

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS]
