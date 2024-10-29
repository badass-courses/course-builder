import { UserSchema } from '@/ability'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentContributions,
	contentResourceResource,
	contentResource as contentResourceTable,
	contentResourceTag,
	contributionTypes,
	tag as tagTable,
	users as usersTable,
} from '@/db/schema'
import { Post, PostSchema } from '@/lib/posts'
import { createNewPostVersion, getPost } from '@/lib/posts-query'
import { EggheadTagSchema } from '@/lib/tags'
import { guid } from '@/utils/guid'
import { createClient } from '@sanity/client'
import slugify from '@sindresorhus/slugify'
import { eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
	VideoResource,
	VideoResourceSchema,
} from '@coursebuilder/core/schemas/video-resource'

import { inngest } from '../inngest.server'

const dateStringToDate = z.date().transform((str) => new Date(str))

export const EggheadUserSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	first_name: z.string().nullable(),
	last_name: z.string().nullable(),
	avatar_url: z.string().nullable(),
})

export const InstructorSchema = z.object({
	id: z.number(),
	first_name: z.string().nullable(),
	last_name: z.string().nullable(),
	email: z.string().email(),
	user_id: z.number(),
})

export type EggheadUser = z.infer<typeof EggheadUserSchema>
export type Instructor = z.infer<typeof InstructorSchema>

export const TIPS_UPDATED_EVENT = 'tips/updated'

export type TipsUpdated = {
	name: typeof TIPS_UPDATED_EVENT
	data: TipsUpdatedEvent
}
export const TipsUpdatedEventSchema = z.object({
	postId: z.string(),
})

export type TipsUpdatedEvent = z.infer<typeof TipsUpdatedEventSchema>

export const sanityWriteClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET_ID || 'production',
	useCdn: false, // `false` if you want to ensure fresh data
	apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
	token: process.env.SANITY_EDITOR_TOKEN,
})

export const migrateTipsToPosts = inngest.createFunction(
	{ id: 'migrate-tips-to-posts', name: 'Migrate Tips to Posts' },
	{ event: TIPS_UPDATED_EVENT },
	async ({ event, step }) => {
		const tips = await step.run('Load tips from sanity', async () => {
			const tips = await sanityWriteClient.fetch(`*[_type == "tip"]{
        ...,
        "resources": resources[]->,
        "collaborators": collaborators[]->,
        "softwareLibraries": softwareLibraries[]{
          ...,
          "library": library->
        }
      }`)
			return tips
		})

		for (const loadedTip of tips) {
			if (!loadedTip.resources?.[0]) continue
			const videoResource = await step.run(
				'Transform video resource',
				async () => {
					const resource = loadedTip.resources[0]
					if (!resource) return null

					return VideoResourceSchema.parse({
						id: guid(),
						title: loadedTip.title,
						duration: resource.duration,
						muxPlaybackId: resource.muxAsset?.muxPlaybackId,
						muxAssetId: resource.muxAsset?.muxAssetId,
						transcript: resource.transcript?.text,
						srt: resource.transcript?.srt,
						state: 'ready',
						createdAt: new Date(resource._createdAt),
						updatedAt: new Date(resource._updatedAt),
					})
				},
			)

			const tags = await step.run(
				'Transform software libraries to tags',
				async () => {
					if (!loadedTip.softwareLibraries?.[0]) return []

					return (
						z.array(EggheadTagSchema).parse(
							await db.query.tag.findMany({
								where: eq(
									sql`JSON_EXTRACT (${tagTable.fields}, "$.slug")`,
									`${loadedTip.softwareLibraries[0].library.slug.current}`,
								),
							}),
						) || []
					)
				},
			)

			const instructor = await step.run(
				'Transform collaborators to users',
				async () => {
					if (!loadedTip.collaborators?.[0]) return null
					const collaborator = loadedTip.collaborators.find(
						(c: any) => c.role === 'instructor',
					)
					const eggheadInstructorId = collaborator?.eggheadInstructorId

					const instructor = InstructorSchema.parse(
						await eggheadPgQuery(
							`SELECT * FROM instructors WHERE id = ${eggheadInstructorId}`,
						).then((res) => res.rows[0]),
					)

					const eggheadUser = EggheadUserSchema.parse(
						await eggheadPgQuery(
							`SELECT * FROM users WHERE id = ${instructor.user_id}`,
						).then((res) => res.rows[0]),
					)

					// lookup egghead instructor based on collaborators.find(instructor).collaborators
					// if no account, create user account based on egghead user id

					const cbUser = await db.query.users.findFirst({
						where: or(
							eq(usersTable.email, eggheadUser.email),
							eq(usersTable.email, instructor.email),
						),
					})

					return {
						eggheadUser,
						instructor,
						cbUser,
					}
				},
			)

			if (instructor) {
				let cbUser: any = instructor.cbUser

				if (!cbUser) {
					cbUser = await step.run('Create user', async () => {
						const newUserId = guid()
						const firstName =
							instructor.instructor.first_name ||
							instructor.eggheadUser.first_name
						const lastName =
							instructor.instructor.last_name ||
							instructor.eggheadUser.last_name
						const fullName = [firstName, lastName].filter(Boolean).join(' ')

						await db.insert(usersTable).values({
							id: newUserId,
							name: fullName,
							email: instructor.eggheadUser.email,
							image: instructor.eggheadUser.avatar_url,
						})

						return db.query.users.findFirst({
							where: eq(usersTable.id, newUserId),
						})
					})
				}

				if (!cbUser) {
					throw new Error('User not found')
				}

				const post = await step.run('Transform tip to post', async () => {
					const post: Post = PostSchema.parse({
						id: loadedTip._id,
						type: 'post',
						createdById: cbUser.id,
						fields: {
							title: loadedTip.title,
							postType: 'lesson',
							summary: loadedTip.summary,
							body: loadedTip.body,
							state: loadedTip.state === 'published' ? 'published' : 'draft',
							visibility: 'public',
							slug: loadedTip.slug.current,
							description: loadedTip.description,
							eggheadLessonId: loadedTip.eggheadRailsLessonId,
						},
						resources: videoResource
							? [
									{
										resourceId: videoResource.id,
										resourceOfId: loadedTip._id,
										position: 0,
										metadata: {},
										createdAt: new Date(loadedTip._createdAt),
										updatedAt: new Date(loadedTip._updatedAt),
										deletedAt: null,
										resource: videoResource,
									},
								]
							: [],
						tags: tags.map((tag, index) => ({
							contentResourceId: loadedTip._id,
							tagId: tag.id,
							position: index,
							createdAt: new Date(loadedTip._createdAt),
							updatedAt: new Date(loadedTip._updatedAt),
						})),
						createdAt: new Date(loadedTip._createdAt),
						updatedAt: new Date(loadedTip._updatedAt),
						deletedAt: null,
					})

					return post
				})

				// step to create the content resource
				await step.run('Create content resource', async () => {
					const existingPost = await db.query.contentResource.findFirst({
						where: eq(contentResourceTable.id, post.id),
					})

					if (existingPost) {
						return existingPost
					}

					await db.insert(contentResourceTable).values({
						id: post.id,
						type: 'post',
						createdById: cbUser.id,
						createdAt: new Date(loadedTip._createdAt),
						updatedAt: new Date(loadedTip._updatedAt),
						fields: {
							...post.fields,
							postType: 'tip',
						},
					})

					return db.query.contentResource.findFirst({
						where: eq(contentResourceTable.id, post.id),
					})
				})

				await step.run('create content resource version', async () => {
					const newPost = await getPost(post.id)
					if (!newPost) return
					await createNewPostVersion(newPost)
				})

				await step.run('Create video resource', async () => {
					if (!videoResource) return

					await db.insert(contentResourceTable).values({
						id: videoResource.id,
						type: 'videoResource',
						createdById: cbUser.id,
						createdAt: new Date(loadedTip._createdAt),
						updatedAt: new Date(loadedTip._updatedAt),
						deletedAt: null,
						fields: {
							title: loadedTip.title,
							duration: videoResource.duration,
							muxPlaybackId: videoResource.muxPlaybackId,
							muxAssetId: videoResource.muxAssetId,
							transcript: videoResource.transcript,
							srt: videoResource.srt,
							state: 'ready',
						},
					})

					await db.insert(contentResourceResource).values({
						resourceOfId: post.id,
						resourceId: videoResource.id,
					})

					return db.query.contentResourceResource.findFirst({
						where: eq(contentResourceResource.resourceId, videoResource.id),
					})
				})

				// step to add the contribution
				await step.run('Create contribution', async () => {
					const contributionType = await db.query.contributionTypes.findFirst({
						where: eq(contributionTypes.slug, 'author'),
					})

					if (contributionType) {
						await db.insert(contentContributions).values({
							id: `cc-${guid()}`,
							userId: cbUser.id,
							contentId: post.id,
							contributionTypeId: contributionType.id,
						})
					}

					return db.query.contentContributions.findFirst({
						where: eq(contentContributions.contentId, post.id),
					})
				})

				// step to add the tags
				await step.run('Create tags', async () => {
					let tagIndex = 0
					try {
						for (const tag of tags) {
							await db.insert(contentResourceTag).values({
								contentResourceId: post.id,
								tagId: tag.id,
								position: tagIndex,
							})
						}
					} catch (error) {
						console.error('🚨 Error creating tags', error)
					}
				})
			}
		}
	},
)
