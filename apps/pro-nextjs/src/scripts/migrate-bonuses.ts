import fs from 'node:fs'
import { db } from '@/db'
import { contentResource, contentResourceResource, users } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import {
	contributors,
	recordResourceContribution,
} from '@/scripts/contributors-list'
import { sanityQuery } from '@/scripts/utils/sanity-client'
import { guid } from '@/utils/guid'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { VideoResourceSchema } from '@coursebuilder/core/schemas'

const ContributorSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	slug: z.string(),
})

const TranscriptSchema = z.object({
	text: z.string(),
	srt: z.string().optional().nullable(),
})

const LessonVideoResourceSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	transcript: TranscriptSchema,
	duration: z.number().optional().nullable(),
	muxAsset: z.object({
		muxPlaybackId: z.string(),
		muxAssetId: z.string(),
	}),
	state: z.string().optional().nullable(),
})

const SolutionSchema = z.object({
	_key: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	title: z.string(),
	description: z.string(),
	slug: z.object({ current: z.string() }),
	videoResource: LessonVideoResourceSchema,
})

const SanityLessonSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	title: z.string(),
	body: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	slug: z.string(),
	videoResource: LessonVideoResourceSchema,
	solution: SolutionSchema.optional().nullable(),
})

const LinkResourceSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	description: z.string(),
	slug: z.object({ current: z.string() }),
	url: z.string(),
})

const SectionSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	slug: z.string(),
	lessons: z.array(SanityLessonSchema),
	resources: z.array(LinkResourceSchema),
})

const ModuleSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	title: z.string(),
	body: z.string().nullable().optional(),
	slug: z.object({ current: z.string() }),
	image: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	description: z.string().nullable().optional(),
	moduleType: z.string(),
	state: z.string(),
	instructor: ContributorSchema.nullable(),
	lessons: z.array(SanityLessonSchema),
})

type SanityBonus = z.infer<typeof ModuleSchema>

export async function migrateBonuses(WRITE_TO_DB: boolean = true) {
	const bonuses = await sanityQuery<
		SanityBonus[]
	>(`*[_type == "module" && moduleType == 'bonus'] | order(_createdAt desc) {
    _id,
    _type,
    title,
    slug,
    "image": image.asset->url,
    _updatedAt,
    _createdAt,
    description,
    moduleType,
    state,
    body,
    "instructor": contributors[@.role == 'instructor'][0].contributor->{
      _id,
      _type,
      _updatedAt,
      _createdAt,
      name,
      bio,
      links[] {
        url, label
      },
      picture {
          "url": asset->url,
          alt
      },
      "slug": slug.current,
    },
    "lessons": resources[@->._type in ['interview']]->{
        _id,
        _type,
        _updatedAt,
        title,
        description,
        body,
        "slug": slug.current,
				"videoResource": resources[@->._type == 'videoResource'][0]->{
					...,
					"transcript": coalesce(castingwords{"text": transcript, srt}, transcript),
				},
        "solution": resources[@._type == 'solution'][0]{
          _key,
          _type,
          "_updatedAt": ^._updatedAt,
          title,
          description,
          "slug": slug.current,
					"videoResource": resources[@->._type == 'videoResource'][0]->{
						...,
						"transcript": coalesce(castingwords{"text": transcript, srt}, transcript),
					},
        }
      }

  }`)

	z.array(ModuleSchema).parse(bonuses)

	fs.writeFileSync('bonuses.json', JSON.stringify(bonuses, null, 2))

	for (const bonus of bonuses) {
		// loop through the sections of the bonus and see if they are more than one section
		const newBonusId = bonus._id || guid()
		const createSections = false

		console.log('migrating bonus', {
			newTutorialId: newBonusId,
			createSections,
		})

		const contributorId = contributors['kent-c-dodds']
		const user =
			(contributorId &&
				(await db.query.users.findFirst({
					where: eq(users.id, contributorId),
				}))) ||
			null

		let lessonIndex = 0

		for (const lesson of bonus.lessons) {
			const lessonId = lesson._id || guid()
			const videoResourceId = lesson.videoResource._id || guid()

			const lessonResource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, lessonId),
			})

			if (!lessonResource) {
				console.log('\t\tmigrating lesson resource', {
					lessonId,
					title: lesson.title,
				})
				const videoResource = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, videoResourceId),
				})

				if (!videoResource) {
					const sanityVideoResource = lesson.videoResource
					const newVideoResource = VideoResourceSchema.parse({
						id: videoResourceId,
						createdAt: sanityVideoResource._createdAt,
						updatedAt: sanityVideoResource._updatedAt,
						title: sanityVideoResource.title,
						transcript: sanityVideoResource.transcript?.text,
						srt: sanityVideoResource.transcript?.srt,
						state: 'ready',
						duration: sanityVideoResource.duration,
						muxAssetId: sanityVideoResource.muxAsset.muxAssetId,
						muxPlaybackId: sanityVideoResource.muxAsset.muxPlaybackId,
					})

					WRITE_TO_DB &&
						(await db.insert(contentResource).values({
							id: videoResourceId,
							type: 'videoResource',
							createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
							createdAt: newVideoResource.createdAt,
							updatedAt: newVideoResource.updatedAt,
							deletedAt: null,
							fields: {
								title: newVideoResource.title,
								state: newVideoResource.state,
								duration: newVideoResource.duration,
								muxAssetId: newVideoResource.muxAssetId,
								muxPlaybackId: newVideoResource.muxPlaybackId,
								transcript: newVideoResource.transcript,
								srt: newVideoResource.srt,
							},
						}))

					WRITE_TO_DB &&
						(await db.insert(contentResourceResource).values({
							resourceOfId: lessonId,
							resourceId: videoResourceId,
							position: 0,
						}))
				}

				const transformedLesson = LessonSchema.parse({
					id: lessonId,
					type: lesson._type,
					createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
					createdAt: new Date(bonus._createdAt),
					updatedAt: new Date(bonus._updatedAt),
					deletedAt: null,
					fields: {
						title: lesson.title,
						body: lesson.body,
						description: lesson.description,
						state: 'published',
						visibility: 'public',
						slug: lesson.slug,
					},
				})

				WRITE_TO_DB &&
					(await db.insert(contentResource).values(transformedLesson))

				WRITE_TO_DB &&
					(await db.insert(contentResourceResource).values({
						resourceOfId: newBonusId,
						resourceId: lessonId,
						position: lessonIndex,
					}))
				lessonIndex++
			}
		}
		const existingTutorial = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, newBonusId),
		})

		if (!existingTutorial) {
			await recordResourceContribution({
				contributorSlug: 'kent-c-dodds',
				resourceId: newBonusId,
				contributionType: 'instructor',
			})

			WRITE_TO_DB &&
				(await db.insert(contentResource).values({
					id: newBonusId,
					type: bonus.moduleType,
					createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
					createdAt: new Date(bonus._createdAt),
					updatedAt: new Date(bonus._updatedAt),
					deletedAt: null,
					fields: {
						title: bonus.title,
						body: bonus.body,
						description: bonus.description,
						state: bonus.state,
						visibility: 'public',
						slug: bonus.slug.current,
						image: {
							url: bonus.image,
						},
					},
				}))
		}
	}
}
