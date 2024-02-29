import { sanityQuery } from '@/server/sanity.server'
import { guid } from '@/utils/guid'
import { tags } from 'liquidjs'
import { z } from 'zod'

export const TipStateSchema = z.union([
  z.literal('draft'),
  z.literal('published'),
  z.literal('archived'),
  z.literal('deleted'),
])

export const TipVisibilitySchema = z.union([z.literal('public'), z.literal('private'), z.literal('unlisted')])

export const TipSchema = z.object({
  _id: z.string(),
  _type: z.literal('explainer'),
  _updatedAt: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string().nullable(),
  videoResourceId: z.string().nullable(),
  muxPlaybackId: z.string().nullable(),
  transcript: z.string().nullable(),
  state: TipStateSchema.default('draft'),
  visibility: TipVisibilitySchema.default('unlisted'),
  slug: z.string(),
})

export type Tip = z.infer<typeof TipSchema>

export const MigratedTipResourceSchema = z.object({
  createdById: z.string(),
  title: z.string(),
  type: z.string(),
  slug: z.string(),
  body: z.string().nullable(),
  id: z.string(),
  updatedAt: z.date(),
  resources: z.array(z.object({ _type: z.string(), _ref: z.string() })).default([]),
  metadata: z
    .object({ state: z.string(), visibility: z.string(), summary: z.string().optional().nullable() })
    .default({ state: 'draft', visibility: 'unlisted', summary: null }),
})

export function convertToMigratedTipResource({ tip, ownerUserId }: { tip: Tip; ownerUserId: string }) {
  return MigratedTipResourceSchema.parse({
    createdById: ownerUserId,
    title: tip.title,
    type: 'tip',
    slug: tip.slug,
    body: tip.body,
    id: tip._id,
    updatedAt: new Date(tip._updatedAt),
    resources: tip.videoResourceId
      ? [
          {
            _type: 'reference',
            _ref: tip.videoResourceId,
            key: `videoResource-${guid()}`,
          },
        ]
      : [],
    metadata: {
      state: tip.state,
      visibility: tip.visibility,
      ...(tip.summary && { summary: tip.summary }),
    },
  })
}

export async function getTip(slugOrId: string, revalidateKey: string = 'tips') {
  return await sanityQuery<Tip | null>(
    `*[_type == "tip" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          "_updatedAt": ^._updatedAt,
          title,
          summary,
          visibility,
          state,
          body,
          "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
          "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
          "transcript": resources[@->._type == 'videoResource'][0]->transcript,
          "slug": slug.current,
  }`,
    { tags: [slugOrId, revalidateKey] },
  ).catch((error) => {
    console.error('Error fetching tip', error)
    return null
  })
}

export async function getTipsModule() {
  return await sanityQuery<{
    tips: Tip[]
  }>(
    `{"tips": coalesce(
  *[_type == 'tip'] | order(_updatedAt desc) {
        _id,
        _type,
        "_updatedAt": ^._updatedAt,
        title,
        summary,
        visibility,
        state,
        body,
        "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
        "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
        "transcript": resources[@->._type == 'videoResource'][0]->transcript,
        "slug": slug.current,
      }, [])}`,
    { tags: ['tips'] },
  ).catch((error) => {
    console.error('Error fetching tips module', error)
    return { tips: [] }
  })
}
