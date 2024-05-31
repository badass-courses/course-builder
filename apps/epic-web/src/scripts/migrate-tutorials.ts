import * as fs from 'node:fs'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { LessonSchema } from '@/lib/lessons'
import { recordResourceContribution } from '@/scripts/contributors-list'
import { sanityQuery } from '@/scripts/utils/sanity-client'
import { guid } from '@/utils/guid'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { VideoResourceSchema } from '@coursebuilder/core/schemas'

const WRITE_TO_DB = true

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
	instructor: ContributorSchema,
	sections: z.array(SectionSchema),
})

type SanityTutorial = z.infer<typeof ModuleSchema>

export async function migrateTutorials() {
	const tutorials = await sanityQuery<
		SanityTutorial[]
	>(`*[_type == "module" && moduleType == 'tutorial'] | order(_createdAt desc) {
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
    "sections": resources[@->._type == 'section']->{
      _id,
      _type,
      _updatedAt,
      title,
      description,
      "slug": slug.current,
      "lessons": resources[@->._type in ['exercise', 'explainer', 'lesson']]->{
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
      },
      "resources": resources[@->._type in ['linkResource']]->
    }
  }`)

	fs.writeFileSync('test.json', JSON.stringify(tutorials, null, 2))

	z.array(ModuleSchema).parse(tutorials)

	for (const tutorial of tutorials) {
		// loop through the sections of the tutorial and see if they are more than one section
		const newTutorialId = tutorial._id || guid()
		const createSections = tutorial.sections.length > 1

		console.log('migrating tutorial', { newTutorialId, createSections })

		const incomingContributors = tutorial.instructor

		const user = await recordResourceContribution({
			contributorSlug: incomingContributors.slug,
			resourceId: newTutorialId,
			contributionType: 'instructor',
		})

		let sectionIndex = 0

		for (const section of tutorial.sections) {
			const sectionId = section._id || guid()

			console.log('\tmigrating section', { sectionId })

			// at least one tutorial has a link resource
			for (const resource of section.resources) {
				const linkResource = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, resource._id),
				})

				if (!linkResource && resource._type === 'linkResource') {
					const linkResourceId = resource._id || guid()
					console.log('migrating link resource', { linkResourceId })
					WRITE_TO_DB &&
						(await db.insert(contentResource).values({
							id: linkResourceId,
							type: resource._type,
							createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
							createdAt: new Date(resource._createdAt),
							updatedAt: new Date(resource._updatedAt),
							deletedAt: null,
							fields: {
								title: resource.title,
								description: resource.description,
								slug: resource.slug.current,
								url: resource.url,
							},
						}))

					WRITE_TO_DB &&
						(await db.insert(contentResourceResource).values({
							resourceOfId: createSections ? sectionId : newTutorialId,
							resourceId: linkResourceId,
							position: 0,
						}))
				}
			}

			let lessonIndex = 0

			for (const lesson of section.lessons) {
				const lessonId = lesson._id || guid()
				const videoResourceId = lesson.videoResource._id || guid()

				const lessonResource = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, lessonId),
				})

				if (!lessonResource) {
					console.log('\t\tmigrating lesson resource', { lessonId })
					const videoResource = await db.query.contentResource.findFirst({
						where: eq(contentResource.id, videoResourceId),
					})

					if (!videoResource) {
						console.log('\t\t\tmigrating video resource', { videoResourceId })
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
								createdAt: new Date(newVideoResource.createdAt as string),
								updatedAt: new Date(newVideoResource.updatedAt as string),
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
						createdAt: new Date(tutorial._createdAt),
						updatedAt: new Date(tutorial._updatedAt),
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
							resourceOfId: createSections ? sectionId : newTutorialId,
							resourceId: lessonId,
							position: lessonIndex,
						}))
					lessonIndex++
				}
			}

			if (createSections) {
				const sectionResource = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, sectionId),
				})

				if (!sectionResource) {
					WRITE_TO_DB &&
						(await db.insert(contentResource).values({
							id: sectionId,
							type: section._type,
							createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
							createdAt: new Date(section._updatedAt),
							updatedAt: new Date(section._updatedAt),
							deletedAt: null,
							fields: {
								title: section.title,
								description: section.description,
								slug: section.slug,
							},
						}))

					WRITE_TO_DB &&
						(await db.insert(contentResourceResource).values({
							resourceOfId: newTutorialId,
							resourceId: sectionId,
							position: sectionIndex,
						}))
					sectionIndex++
				}
			}
		}
		WRITE_TO_DB &&
			(await db.insert(contentResource).values({
				id: newTutorialId,
				type: tutorial.moduleType,
				createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
				createdAt: new Date(tutorial._createdAt),
				updatedAt: new Date(tutorial._updatedAt),
				deletedAt: null,
				fields: {
					title: tutorial.title,
					body: tutorial.body,
					description: tutorial.description,
					state: tutorial.state,
					visibility: 'public',
					slug: tutorial.slug.current,
				},
			}))
	}
}
