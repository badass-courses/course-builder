import { db } from '@/db'
import { contentResource, contentResourceResource, users } from '@/db/schema'
import { TipSchema } from '@/lib/tips'
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
	event: z.any().nullable(),
	presenter: z
		.object({
			_type: z.string(),
			name: z.string(),
			picture: z
				.object({
					url: z.string(),
					alt: z.string().nullable().optional(),
				})
				.optional()
				.nullable(),
		})
		.nullable(),
	videoResource: z.object({
		_id: z.string(),
		_type: z.string(),
		_updatedAt: z.string(),
		_createdAt: z.string(),
		title: z.string(),
		poster: z.string().optional().nullable(),
		transcript: z.object({
			text: z.string(),
			srt: z.string().optional().nullable(),
		}),
		duration: z.number().optional(),
		muxAsset: z.object({
			muxPlaybackId: z.string(),
			muxAssetId: z.string(),
		}),
		state: z.string().optional().nullable(),
	}),
})

type Recording = z.infer<typeof RecordingSchema>

export async function migrateTalks(WRITE_TO_DB: boolean = true) {
	const talks = z.array(RecordingSchema).parse(
		await sanityQuery<Recording[]>(`*[_type == "talk" ]{
        	...,
        	"slug": slug.current,
        	"videoResource": resources[@->._type == 'videoResource'][0]->{
						...,
						"transcript": coalesce(castingwords{"text": transcript, srt}, transcript),
					},
					"event": *[_type == "event" && references(^._id)][0] {
						title,
						"slug": slug.current,
						state,
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
        }`),
	)

	for (const talk of talks) {
		const newTalkId = talk._id || guid()
		const videoResourceId = talk.videoResource._id || guid()
		const incomingContributors = talk.contributor
		const contributorId =
			incomingContributors && contributors[incomingContributors.slug]
		const user =
			(contributorId &&
				(await db.query.users.findFirst({
					where: eq(users.id, contributorId),
				}))) ||
			null

		const existingRecording = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, newTalkId),
		})

		// don't migrate if the talk is attached to an event (epic web conf)
		if (!existingRecording && !talk.event) {
			console.info('processing talk', talk.title)
			const videoResource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, videoResourceId),
			})

			if (!videoResource) {
				const sanityVideoResource = talk.videoResource
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
							poster: talk.videoResource.poster,
						},
					}))

				WRITE_TO_DB &&
					(await db.insert(contentResourceResource).values({
						resourceOfId: newTalkId,
						resourceId: videoResourceId,
						position: 0,
					}))
			}

			WRITE_TO_DB &&
				(await db.insert(contentResource).values({
					id: newTalkId,
					type: talk._type,
					createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
					createdAt: new Date(talk._createdAt),
					updatedAt: new Date(talk._updatedAt),
					deletedAt: null,
					fields: {
						title: talk.title,
						body: talk.body,
						description: talk.description,
						state: 'published',
						visibility: 'public',
						slug: talk.slug,
						presenter: {
							picture:
								talk.presenter?.picture?.url ||
								talk.contributor?.picture?.url ||
								null,
							name: talk.presenter?.name || talk.contributor?.name || null,
						},
					},
				}))

			talk.contributor &&
				(await recordResourceContribution(
					{
						contributorSlug: talk.contributor.slug,
						resourceId: newTalkId,
						contributionType: 'presenter',
					},
					WRITE_TO_DB,
				))
		}
	}
}
