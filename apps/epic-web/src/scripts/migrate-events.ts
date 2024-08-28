import fs from 'node:fs'
import { db } from '@/db'
import { contentResource, contentResourceResource, users } from '@/db/schema'
import {
	contributors,
	recordResourceContribution,
} from '@/scripts/contributors-list'
import { writeContributionTypes } from '@/scripts/controbution-types'
import { sanityQuery } from '@/scripts/utils/sanity-client'
import { guid } from '@/utils/guid'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { VideoResourceSchema } from '@coursebuilder/core/schemas'

await writeContributionTypes()

const ContributorSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	name: z.string(),
	slug: z.string(),
	bio: z.string().optional().nullable(),
	twitterHandle: z.string().optional().nullable(),
	links: z
		.array(
			z.object({
				label: z.string().optional().nullable(),
				url: z.string(),
			}),
		)
		.optional()
		.nullable(),
	picture: z
		.object({
			url: z.string(),
			alt: z.string(),
		})
		.optional()
		.nullable(),
})

const RecordingSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	state: z.string(),
	title: z.string(),
	description: z.string(),
	body: z.string(),
	slug: z.string(),
	contributor: ContributorSchema.nullable().optional(),
	presenter: z.object({
		_type: z.string(),
		name: z.string(),
		picture: z
			.object({
				url: z.string(),
				alt: z.string().nullable().optional(),
			})
			.optional()
			.nullable(),
	}),
	videoResource: z.object({
		_id: z.string(),
		_type: z.string(),
		_updatedAt: z.string(),
		_createdAt: z.string(),
		title: z.string(),
		poster: z.string().optional().nullable(),
		transcript: z.object({
			text: z.string(),
			srt: z.string(),
		}),
		duration: z.number(),
		muxAsset: z.object({
			muxPlaybackId: z.string(),
			muxAssetId: z.string(),
		}),
		state: z.string(),
	}),
})

type Recording = z.infer<typeof RecordingSchema>

const sanityEventSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string(),
	slug: z.string(),
	startsAt: z.string().nullable(),
	endsAt: z.string().nullable(),
	host: ContributorSchema.nullable(),
	description: z.nullable(z.string()).optional(),
	body: z.nullable(z.string()).optional(),
	state: z.string(),
	timezone: z.nullable(z.string().url()).optional(),
	recordings: z.array(RecordingSchema),
	events: z.array(
		z.object({
			title: z.string(),
			startsAt: z.string(),
			endsAt: z.string(),
		}),
	),
	image: z
		.object({
			width: z.number(),
			height: z.number(),
			secure_url: z.string(),
		})
		.partial()
		.optional()
		.nullable(),
	ogImage: z
		.object({
			secure_url: z.string(),
		})
		.partial()
		.optional()
		.nullable(),
	product: z
		.object({
			_id: z.string(),
			slug: z.string(),
			title: z.string(),
			productId: z.string(),
		})
		.nullable(),
})

export const EventsSchema = z.array(sanityEventSchema)

type SanityEvent = z.infer<typeof sanityEventSchema>

export async function migrateEvents(WRITE_TO_DB: boolean = true) {
	const events = await sanityQuery<
		SanityEvent[]
	>(`*[_type == "event"] | order(_createdAt desc) {
        _id,
        _type,
        _updatedAt,
        _createdAt,
        "host": contributors[@.role == 'host'][0].contributor->{
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
        title,
        state,
        "slug": slug.current,
        startsAt,
        endsAt,
        description,
        timezone,
        body,
        image,
        ogImage,
        "events": coalesce(events[_type != 'reference'], []),
        "recordings": coalesce(events[@->._type == 'talk']->{
        	...,
        	"slug": slug.current,
        	"videoResource": resources[@->._type == 'videoResource'][0]->{
						...,
						"transcript": coalesce(castingwords{"text": transcript, srt}, transcript),
					},
					"contributor": contributors[@.role == 'presenter'][0].contributor->{
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
					"presenter": contributors[@._type == 'oneTimeContributor'][0]{
					...,
					picture {
              "url": asset->url,
              alt
          }
					}
        }, []),
        "product": *[_type in ['product'] && references(^._id)][0]{
          _id,
          productId,
          "slug": slug.current,
          title
        }
  }`)

	fs.writeFileSync('events.json', JSON.stringify(events, null, 2))

	for (const event of events) {
		console.info('creating event', event.title)
		const existingEvent = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, event._id),
		})

		const incomingContributors = event.host
		const contributorId =
			(incomingContributors && contributors[incomingContributors.slug]) || null
		const user =
			(contributorId &&
				(await db.query.users.findFirst({
					where: eq(users.id, contributorId),
				}))) ||
			null

		if (!existingEvent) {
			const newResourceId = event._id || guid()

			// all events have an array of event start/end times (n+1)
			if (event.events.length === 0 && event.startsAt && event.endsAt) {
				event.events.push({
					startsAt: event.startsAt,
					endsAt: event.endsAt,
					title: event.title,
				})
			}

			//process recordings
			let recordingIndex = 0
			for (const recording of event.recordings) {
				console.info('\t\tprocessing event recording', recording.title)
				const newRecordingId = recording._id || guid()
				const videoResourceId = recording.videoResource._id || guid()
				const existingRecording = await db.query.contentResource.findFirst({
					where: eq(contentResource.id, newRecordingId),
				})

				if (!existingRecording) {
					const videoResource = await db.query.contentResource.findFirst({
						where: eq(contentResource.id, videoResourceId),
					})

					if (!videoResource) {
						const sanityVideoResource = recording.videoResource
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
									poster: recording.videoResource.poster,
								},
							}))

						WRITE_TO_DB &&
							(await db.insert(contentResourceResource).values({
								resourceOfId: newRecordingId,
								resourceId: videoResourceId,
								position: 0,
							}))
					}
				}

				WRITE_TO_DB &&
					(await db.insert(contentResource).values({
						id: newRecordingId,
						type: recording._type,
						createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
						createdAt: new Date(recording._createdAt),
						updatedAt: new Date(recording._updatedAt),
						deletedAt: null,
						fields: {
							title: recording.title,
							body: recording.body,
							description: recording.description,
							state: 'published',
							visibility: 'public',
							slug: recording.slug,
							presenter: {
								picture: recording.presenter.picture?.url || null,
								name: recording.presenter.name,
							},
						},
					}))

				recording.contributor &&
					(await recordResourceContribution(
						{
							contributorSlug: recording.contributor.slug,
							resourceId: newRecordingId,
							contributionType: 'presenter',
						},
						WRITE_TO_DB,
					))

				WRITE_TO_DB &&
					(await db.insert(contentResourceResource).values({
						resourceOfId: newResourceId,
						resourceId: newRecordingId,
						position: recordingIndex,
					}))

				recordingIndex++
			}

			event.host &&
				(await recordResourceContribution(
					{
						contributorSlug: event.host.slug,
						resourceId: newResourceId,
						contributionType: 'host',
					},
					WRITE_TO_DB,
				))

			WRITE_TO_DB &&
				(await db.insert(contentResource).values({
					id: newResourceId,
					type: event._type,
					createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
					createdAt: new Date(event._createdAt),
					updatedAt: new Date(event._updatedAt),
					deletedAt: null,
					fields: {
						title: event.title,
						body: event.body,
						description: event.description,
						state: event.state,
						visibility: 'public',
						slug: event.slug,
						image: event.image?.secure_url || null,
						ogImage: event.ogImage?.secure_url || null,
						timezone: event.timezone || null,
						events: event.events.map((event) => {
							return {
								title: event.title,
								startsAt: event.startsAt,
								endsAt: event.endsAt,
							}
						}),
					},
				}))
		}
	}
}
