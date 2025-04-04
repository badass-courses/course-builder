import { db } from '@/db'
import { contentResource, resourceProgress } from '@/db/schema'
import { PostSchema } from '@/lib/posts'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

export const PostCompletionStatsSchema = z.object({
	post: PostSchema,
	completions: z.number(),
})

export const TutorialCompletionStatsSchema = z.object({
	tutorial: PostSchema,
	totalResources: z.number(),
	fullCompletions: z.number(),
	partialCompletions: z.number(),
})

export type PostCompletionStats = z.infer<typeof PostCompletionStatsSchema>
export type TutorialCompletionStats = z.infer<
	typeof TutorialCompletionStatsSchema
>

export const ListCompletionStatsSchema = z.object({
	list: PostSchema,
	totalResources: z.number(),
	fullCompletions: z.number(),
	partialCompletions: z.number(),
})

export type ListCompletionStats = z.infer<typeof ListCompletionStatsSchema>

export async function getPostCompletionStats() {
	const posts = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, [
				'published',
			]),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
			tags: {
				with: {
					tag: true,
				},
			},
		},
	})

	const parsedPosts = z.array(PostSchema).safeParse(posts)
	if (!parsedPosts.success) {
		console.error('Error parsing posts', parsedPosts.error)
		return []
	}

	const completionCounts = await Promise.all(
		parsedPosts.data.map(async (post) => {
			const completions = await db.query.resourceProgress.findMany({
				where: eq(resourceProgress.resourceId, post.id),
				columns: {
					userId: true,
				},
			})

			const stats = {
				post,
				completions: completions.length,
			}

			const parsedStats = PostCompletionStatsSchema.safeParse(stats)
			if (!parsedStats.success) {
				console.error('Error parsing post stats', parsedStats.error)
				return null
			}

			return parsedStats.data
		}),
	)

	return completionCounts.filter(
		(stats): stats is PostCompletionStats => stats !== null,
	)
}

export async function getListCompletionStats() {
	const lists = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'list'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.state') = 'published'`,
			// sql`JSON_EXTRACT(${contentResource.fields}, '$.type') IN ('tutorial', 'nextUp', 'workshop')`,
		),
		orderBy: [
			sql`JSON_EXTRACT(${contentResource.fields}, '$.type')`,
			desc(contentResource.createdAt),
		],
		with: {
			resources: {
				with: {
					resource: true,
				},
			},
		},
	})

	const listStats = await Promise.all(
		lists.map(async (list) => {
			const resourceIds = list.resources?.map((r) => r.resourceId) || []
			const userCompletions = await db.query.resourceProgress.findMany({
				where: inArray(resourceProgress.resourceId, resourceIds),
				columns: {
					userId: true,
					resourceId: true,
				},
			})

			const userCompletionMap = userCompletions.reduce<
				Record<string, string[]>
			>((acc, curr) => {
				if (curr.userId && curr.resourceId) {
					acc[curr.userId] = [...(acc[curr.userId] || []), curr.resourceId]
				}
				return acc
			}, {})

			const fullCompletions = Object.values(userCompletionMap).filter(
				(completedResources) =>
					resourceIds.every((id) => completedResources.includes(id)),
			).length

			return {
				list,
				totalResources: resourceIds.length,
				fullCompletions,
				partialCompletions:
					Object.keys(userCompletionMap).length - fullCompletions,
			}
		}),
	)

	return listStats
}
