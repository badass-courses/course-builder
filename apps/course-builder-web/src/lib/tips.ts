import {z} from 'zod'
import {sanityQuery} from '@/server/sanity.server'

const TipSchema = z.object({
  _id: z.string(),
  _type: z.literal('explainer'),
  _updatedAt: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  videoResourceId: z.string(),
  muxPlaybackId: z.string(),
  transcript: z.string().nullable(),
  slug: z.string(),
})

export type Tip = z.infer<typeof TipSchema>

export async function getTip(slugOrId: string) {
  return await sanityQuery<Tip>(`*[_type == "tip" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")][0]{
          _id,
          _type,
          "_updatedAt": ^._updatedAt,
          title,
          summary,
          body,
          "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
          "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
          "transcript": resources[@->._type == 'videoResource'][0]->transcript,
          "slug": slug.current,
  }`)
}

export async function getTipsModule() {
  return await sanityQuery<{
    _id: string
    tips: Tip[]
  }>(`*[_type == "module" && moduleType == "tips"][0]{
    _id,
    "tips": coalesce(resources[@->._type == 'tip']->{
        _id,
        _type,
        "_updatedAt": ^._updatedAt,
        title,
        summary,
        body,
        "muxPlaybackId": resources[@->._type == 'videoResource'][0]->muxPlaybackId,
        "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
        "transcript": resources[@->._type == 'videoResource'][0]->transcript,
        "slug": slug.current,
      }, [])
  }`)
}
