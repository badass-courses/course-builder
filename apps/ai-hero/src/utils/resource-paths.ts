import { z } from 'zod'

/**
 * Resource path management system for handling different resource types and contexts
 */
export const ResourceContextSchema = z.object({
	parentType: z.string(),
	parentSlug: z.string(),
	getParentSlug: z.function().optional(),
})
export type ResourceContext = z.infer<typeof ResourceContextSchema>

export type ResourcePathConfig = {
	edit: (slug: string, context?: ResourceContext) => string
	view: (slug: string, context?: ResourceContext) => string
}

const resourcePaths: Record<string, ResourcePathConfig> = {
	lesson: {
		edit: (slug, context) => {
			if (context?.parentType === 'workshop') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for workshop lesson')
					return `/lessons/${slug}/edit`
				}
				return `/workshops/${parentSlug}/${slug}/edit`
			}
			if (context?.parentType === 'list') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for list lesson')
					return `/${slug}/edit`
				}
				return `/posts/${slug}/edit`
			}
			return `/posts/${slug}/edit`
		},
		view: (slug, context) => {
			if (context?.parentType === 'workshop') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for workshop lesson')
					return `/lessons/${slug}`
				}
				return `/workshops/${parentSlug}/${slug}`
			}
			if (context?.parentType === 'list') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for list lesson')
					return `/${slug}`
				}
				return `/${slug}`
			}
			return `/${slug}`
		},
	},
	post: {
		edit: (slug) => `/posts/${slug}/edit`,
		view: (slug) => `/${slug}`,
	},
	workshop: {
		edit: (slug) => `/workshops/${slug}/edit`,
		view: (slug) => `/workshops/${slug}`,
	},
	tutorial: {
		edit: (slug) => `/lists/${slug}/edit`,
		view: (slug) => `/${slug}`,
	},
	section: {
		edit: (slug) => ``,
		view: (slug) => ``,
	},
	solution: {
		view: (slug, context) => {
			if (context?.parentType === 'workshop') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for workshop lesson')
					return `/${slug}`
				}
				return `/workshops/${parentSlug}/${slug}/solution`
			}

			return `/${slug}`
		},
		edit: (slug, context) => {
			if (context?.parentType === 'workshop') {
				const parentSlug = context.parentSlug || context.getParentSlug?.()
				if (!parentSlug) {
					console.warn('No parent slug found for workshop lesson')
					return `/posts/${slug}/edit`
				}
				return `/workshops/${parentSlug}/${slug}/solution/edit`
			}
			return `/posts/${slug}/edit`
		},
	},
}

/**
 * Get the resource path for a given resource type and slug
 *
 * @param type Resource type (lesson, post, workshop, etc.)
 * @param slug Resource slug
 * @param mode View mode (edit or view)
 * @param context Optional context for nested resources
 * @returns The resource path
 */
export function getResourcePath(
	type: string,
	slug: string,
	mode: 'edit' | 'view' = 'view',
	context?: ResourceContext,
): string {
	const config = resourcePaths[type]
	if (!config) {
		console.warn(
			`Unknown resource type: ${type}, falling back to /${type}/${slug}`,
		)
		return `/${type}/${slug}${mode === 'edit' ? '/edit' : ''}`
	}
	return config[mode](slug, context)
}
