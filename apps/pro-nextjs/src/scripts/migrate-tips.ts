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

const sanityTipSchema = z.object({
	contributors: z
		.array(
			z.object({
				slug: z.object({
					current: z.string(),
				}),
			}),
		)
		.default([]),
	body: z.string().optional(),
	slug: z.object({
		current: z.string(),
	}),
	_type: z.string(),
	description: z.string().optional(),
	videoResource: z.object({
		_id: z.string(),
		state: z.string().default('ready'),
		poster: z.string().optional(),
		transcript: z
			.object({
				text: z.string(),
				srt: z.string().nullable(),
			})
			.optional(),
		_type: z.string(),
		muxAsset: z.object({
			muxPlaybackId: z.string(),
			muxAssetId: z.string(),
		}),
		_updatedAt: z.string(),
		originalMediaUrl: z.string(),
		duration: z.number().optional(),
		_createdAt: z.string(),
		title: z.string(),
	}),
	_id: z.string(),
	title: z.string(),
	_updatedAt: z.string(),
	_rev: z.string(),
	state: z.string(),
	_createdAt: z.string(),
})

type SanityTip = z.infer<typeof sanityTipSchema>

export async function migrateTips(WRITE_TO_DB: boolean = true) {
	const tips = z.array(sanityTipSchema).parse(
		await sanityQuery<SanityTip[]>(`*[_type == "tip"]{
	...,
	"videoResource": resources[@->._type == 'videoResource'][0]->{
		...,
		"transcript": coalesce(castingwords{"text": transcript, srt}, transcript),
	},
	"contributors": coalesce(contributors[].contributor->{
		...
	}, [])
}`),
	)

	for (const tip of tips) {
		console.log(tip.state)
		const resource = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, tip._id),
		})

		if (!tip.videoResource.transcript) {
			console.log('no transcript', tip.videoResource)
		}

		if (tip.contributors.length === 0) {
			console.log('no contributors', tip._id)
		}

		if (resource) {
			console.log(tip.contributors)
			console.log('resource found', tip._id)
		} else {
			const newResourceId = tip._id || guid()

			const incomingContributors = tip.contributors[0] as any
			const contributorId = contributors[incomingContributors.slug]
			const user =
				(contributorId &&
					(await db.query.users.findFirst({
						where: eq(users.id, contributorId),
					}))) ||
				null

			const sanityVideoResource = tip.videoResource

			const videoResourceId = sanityVideoResource._id || guid()

			console.log('creating video resource', videoResourceId)

			const existingVideoResource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, videoResourceId),
			})

			if (!existingVideoResource) {
				const videoResource = VideoResourceSchema.parse({
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
						id: videoResource.id,
						type: 'videoResource',
						createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
						createdAt: new Date(videoResource.createdAt as string),
						updatedAt: new Date(videoResource.updatedAt as string),
						deletedAt: null,
						fields: {
							title: videoResource.title,
							state: videoResource.state,
							duration: videoResource.duration,
							muxAssetId: videoResource.muxAssetId,
							muxPlaybackId: videoResource.muxPlaybackId,
							transcript: videoResource.transcript,
							srt: videoResource.srt,
						},
					}))
			}

			const transformedTip = TipSchema.parse({
				id: newResourceId,
				type: tip._type,
				createdById: user?.id ?? '7ee4d72c-d4e8-11ed-afa1-0242ac120002',
				createdAt: new Date(tip._createdAt),
				updatedAt: new Date(tip._updatedAt),
				deletedAt: null,
				fields: {
					title: tip.title,
					body: tip.body,
					description: tip.description,
					state: tip.state,
					visibility: 'public',
					slug: tip.slug.current,
				},
			})

			const existingTip = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, newResourceId),
			})

			if (!existingTip) {
				WRITE_TO_DB &&
					(await db.insert(contentResourceResource).values({
						resourceOfId: newResourceId,
						resourceId: videoResourceId,
						position: 0,
					}))

				console.info('created tip', newResourceId)
				await recordResourceContribution(
					{
						contributorSlug: incomingContributors.slug.current,
						resourceId: newResourceId,
						contributionType: 'author',
					},
					WRITE_TO_DB,
				)
				WRITE_TO_DB && (await db.insert(contentResource).values(transformedTip))
			}
		}
	}
}
