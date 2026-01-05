'use server'

/**
 * Logger interface for authorization logging
 */
export interface AuthLogger {
	error: (event: string, data?: Record<string, unknown>) => Promise<void> | void
	info: (event: string, data?: Record<string, unknown>) => Promise<void> | void
}

/**
 * Ability interface (compatible with CASL)
 */
export interface Ability {
	can: (action: string, subject: string | object) => boolean
}

/**
 * Session type for auth
 */
export interface AuthSession {
	user?: {
		id: string
		email?: string | null
		name?: string | null
		role?: string
	} | null
}

/**
 * Auth result from getAuth function
 */
export interface AuthResult {
	session: AuthSession | null
	ability: Ability
}

/**
 * Configuration for authorization wrapper
 */
export interface AuthConfig {
	/** Function to get server auth session */
	getAuth: () => Promise<AuthResult>
	/** Optional logger for auth events */
	logger?: AuthLogger
}

/**
 * Authorization check options
 */
export interface AuthCheckOptions {
	/** CASL action (e.g., 'create', 'update', 'delete') */
	action: string
	/** CASL subject (e.g., 'Content', 'User') */
	subject: string
}

/**
 * Context passed to authorized functions
 */
export interface AuthContext {
	user: NonNullable<AuthSession['user']>
	ability: Ability
	session: AuthSession
}

/**
 * Creates an authorization configuration that can be used with withAuthorization.
 *
 * @example
 * ```ts
 * // In your app's query-config.ts
 * import { getServerAuthSession } from '@/server/auth'
 * import { log } from '@/server/logger'
 *
 * export const authConfig = createAuthConfig({
 *   getAuth: getServerAuthSession,
 *   logger: log,
 * })
 * ```
 */
export function createAuthConfig(config: AuthConfig): AuthConfig {
	return config
}

/**
 * Wraps a function with authorization checks.
 * Validates user is authenticated and has required ability before executing.
 *
 * @example
 * ```ts
 * import { authConfig } from './query-config'
 *
 * export const createPost = withAuthorization(
 *   authConfig,
 *   { action: 'create', subject: 'Content' },
 *   async (ctx, input: NewPostInput) => {
 *     // ctx.user is guaranteed to exist and have required permissions
 *     const postId = `post_${guid()}`
 *     await db.insert(contentResource).values({
 *       id: postId,
 *       createdById: ctx.user.id,
 *       // ...
 *     })
 *     return getPost(postId)
 *   }
 * )
 * ```
 */
export function withAuthorization<TInput, TResult>(
	config: AuthConfig,
	options: AuthCheckOptions,
	fn: (ctx: AuthContext, input: TInput) => Promise<TResult>,
): (input: TInput) => Promise<TResult> {
	return async (input: TInput): Promise<TResult> => {
		const { session, ability } = await config.getAuth()
		const user = session?.user

		if (!user) {
			await config.logger?.error(
				`${options.subject.toLowerCase()}.${options.action}.unauthorized`,
				{
					reason: 'not_authenticated',
				},
			)
			throw new Error('Unauthorized: Not authenticated')
		}

		if (!ability.can(options.action, options.subject)) {
			await config.logger?.error(
				`${options.subject.toLowerCase()}.${options.action}.unauthorized`,
				{
					userId: user.id,
					action: options.action,
					subject: options.subject,
				},
			)
			throw new Error(
				`Unauthorized: Cannot ${options.action} ${options.subject}`,
			)
		}

		return fn({ user, ability, session }, input)
	}
}

/**
 * Wraps a function with authorization checks against a specific resource.
 * Use this when the authorization check depends on the specific resource being accessed.
 *
 * @example
 * ```ts
 * export const updatePost = withResourceAuthorization(
 *   authConfig,
 *   { action: 'update' },
 *   async (ctx, input: PostUpdate) => {
 *     const post = await getPost(input.id)
 *     if (!post) throw new Error('Post not found')
 *
 *     // Check against specific resource
 *     return { resource: post, shouldProceed: true }
 *   },
 *   async (ctx, input, post) => {
 *     // Perform the update
 *     return await updatePostInDb(input)
 *   }
 * )
 * ```
 */
export function withResourceAuthorization<TInput, TResource, TResult>(
	config: AuthConfig,
	options: { action: string },
	getResource: (
		ctx: AuthContext,
		input: TInput,
	) => Promise<{
		resource: TResource
		subjectFn: (resource: TResource) => object
	}>,
	fn: (
		ctx: AuthContext,
		input: TInput,
		resource: TResource,
	) => Promise<TResult>,
): (input: TInput) => Promise<TResult> {
	return async (input: TInput): Promise<TResult> => {
		const { session, ability } = await config.getAuth()
		const user = session?.user

		if (!user) {
			await config.logger?.error(`resource.${options.action}.unauthorized`, {
				reason: 'not_authenticated',
			})
			throw new Error('Unauthorized: Not authenticated')
		}

		const ctx: AuthContext = { user, ability, session }
		const { resource, subjectFn } = await getResource(ctx, input)
		const subject = subjectFn(resource)

		if (!ability.can(options.action, subject)) {
			await config.logger?.error(`resource.${options.action}.unauthorized`, {
				userId: user.id,
				action: options.action,
			})
			throw new Error(`Unauthorized: Cannot ${options.action} this resource`)
		}

		return fn(ctx, input, resource)
	}
}

/**
 * Simple authentication check without ability verification.
 * Use when you only need to ensure user is logged in.
 *
 * @example
 * ```ts
 * export const getUserPosts = requireAuth(
 *   authConfig,
 *   async (ctx) => {
 *     return await getPostsForUser(ctx.user.id)
 *   }
 * )
 * ```
 */
export function requireAuth<TResult>(
	config: AuthConfig,
	fn: (ctx: AuthContext) => Promise<TResult>,
): () => Promise<TResult> {
	return async (): Promise<TResult> => {
		const { session, ability } = await config.getAuth()
		const user = session?.user

		if (!user) {
			await config.logger?.error('auth.required.unauthorized', {
				reason: 'not_authenticated',
			})
			throw new Error('Unauthorized: Not authenticated')
		}

		return fn({ user, ability, session })
	}
}
