import fs from 'fs/promises'
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
	_rev: z.string().optional().nullable(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	originalMediaUrl: z.string().optional().nullable(),
	transcript: TranscriptSchema,
	duration: z.number().optional().nullable(),
	muxAsset: z.object({
		muxPlaybackId: z.string(),
		muxAssetId: z.string(),
		_type: z.string(),
	}),
	state: z.string().optional().nullable(),
})

const SolutionSchema = z.object({
	_key: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	body: z.string().nullable().optional(),
	description: z.string(),
	slug: z.string().optional().nullable(),
	videoResource: LessonVideoResourceSchema,
	github: z
		.object({
			repo: z.string(),
		})
		.optional()
		.nullable(),
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
	github: z
		.object({
			repo: z.string(),
		})
		.optional()
		.nullable(),
	gitpod: z
		.object({
			url: z.string(),
		})
		.optional()
		.nullable(),
})

const LinkResourceSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	description: z.string(),
	slug: z.object({ current: z.string() }).optional().nullable(),
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
	image: z.object({
		url: z.string(),
	}),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	description: z.string().nullable().optional(),
	moduleType: z.string(),
	state: z.string(),
	// instructor: ContributorSchema,
	sections: z.array(SectionSchema),
	github: z.object({ repo: z.string() }),
})

type SanityTutorial = z.infer<typeof ModuleSchema>

export async function migrateTutorials(WRITE_TO_DB: boolean = true) {
	const tutorials = await sanityQuery<
		SanityTutorial[]
	>(`*[_type == "module" && moduleType == 'tutorial'] | order(_createdAt desc) {
    _id,
    _type,
    title,
    slug,
    "image": {"url": image.secure_url},
    _updatedAt,
    _createdAt,
    description,
    moduleType,
		github { repo },
    state,
    body,
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
				"github": resources[@->_type == 'githubRepo'][0]{
					repo,
				},
				"gitpod": resources[@->_type == 'gitpod'][0]{
					url,
				},
				"videoResource": resources[@->._type == 'videoResource'][0]->{
					...,
					transcript {srt, text},
				},
        "solution": resources[@._type == 'solution'][0]{
          _key,
          _type,
					"_createdAt": ^._createdAt,
          "_updatedAt": ^._updatedAt,
          title,
          description,
          "slug": slug.current,
					body,
					"github": resources[@->_type == 'githubRepo'][0]{
						repo,
					},
					"videoResource": resources[@->._type == 'videoResource'][0]->{
						...,
						transcript {srt, text},
					},
        }
      },
      "resources": resources[@->._type in ['linkResource']]->
    }
  }`)

	console.log('tutorials: ', tutorials[0]?.sections[0])

	// await fs.writeFile('./tutorials.json', JSON.stringify(tutorials, null, 2))

	z.array(ModuleSchema).parse(tutorials)

	for (const tutorial of tutorials) {
		// loop through the sections of the tutorial and see if they are more than one section
		const newTutorialId = tutorial._id || guid()
		const createSections = tutorial.sections.length > 1

		console.log('migrating tutorial', { newTutorialId, createSections })

		const incomingContributors = {
			slug: 'jack-herrington',
		} // tutorial.instructor
		const contributorId = contributors[incomingContributors.slug]
		const user =
			(contributorId &&
				(await db.query.users.findFirst({
					where: eq(users.id, contributorId),
				}))) ||
			null

		let sectionIndex = 0

		for (const section of tutorial.sections) {
			const sectionId = section._id || guid()

			console.log('\tmigrating section', { sectionId, title: section.title })

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
								...(resource.slug?.current && { slug: resource.slug.current }),
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

					// SOLUTION

					if (lesson._type === 'exercise' && lesson.solution) {
						const solution = lesson.solution
						const existingSolution = await db.query.contentResource.findFirst({
							where: eq(contentResource.id, solution._key),
						})

						const solutionVideoResourceId = solution.videoResource._id || guid()
						const solutionVideoResource =
							await db.query.contentResource.findFirst({
								where: eq(contentResource.id, solutionVideoResourceId),
							})
						if (!existingSolution) {
							console.log('\t\tmigrating solution resource', {
								title: lesson.solution.title,
								id: lesson.solution._key,
								resourceOfId: lessonId,
							})
							if (!solutionVideoResource) {
								console.log('\t\tmigrating solution VIDEO resource', {
									muxPlaybackId: solution.videoResource.muxAsset.muxPlaybackId,
									id: solutionVideoResourceId,
									resourceOfId: solution._key,
								})
								const sanityVideoResource = solution.videoResource
								const newVideoResource = VideoResourceSchema.parse({
									id: solutionVideoResourceId,
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
										id: solutionVideoResourceId,
										type: 'videoResource',
										createdById:
											user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
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
										resourceOfId: solution._key,
										resourceId: solutionVideoResourceId,
										position: 0,
									}))
							}

							const transformedSolution = LessonSchema.parse({
								id: solution._key,
								type: solution._type,
								createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
								createdAt: new Date(solution._createdAt),
								updatedAt: new Date(solution._updatedAt),
								deletedAt: null,
								fields: {
									title: solution.title,
									body: solution.body,
									state: 'published',
									visibility: 'public',
									description: solution.description,
									slug: solution.slug,
								},
							})

							WRITE_TO_DB &&
								(await db.insert(contentResource).values(transformedSolution))

							WRITE_TO_DB &&
								(await db.insert(contentResourceResource).values({
									resourceOfId: lessonId,
									resourceId: solution._key,
									position: 0,
								}))
						}
					}

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

		const existingTutorial = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, newTutorialId),
		})

		if (!existingTutorial) {
			await recordResourceContribution({
				contributorSlug: incomingContributors.slug,
				resourceId: newTutorialId,
				contributionType: 'instructor',
			})

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
						github: tutorial.github.repo,
						image: {
							url: tutorial.image.url,
						},
					},
				}))
		}
	}
}
