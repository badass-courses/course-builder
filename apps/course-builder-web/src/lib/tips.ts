import {z} from 'zod'
import {sanityQuery, runQuery} from '@/server/sanity.server'
import {q} from 'groqd'

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

export async function getTipGroqD(slugOrId: string) {
  const fromVideoResource = q('resources')
    .filter("@->._type == 'videoResource'")
    .slice(0)
    .deref()

  const groqQuery = q('*')
    .filter(
      `_type == "tip" && (_id == "${slugOrId}" || slug.current == "${slugOrId}")`,
    )
    .grab({
      _id: q.string(),
      _type: q.string(),
      _updatedAt: q.string(),
      title: q.string(),
      summary: q.string().nullable(),
      body: q.string().nullable(),
      muxPlaybackId: fromVideoResource.grabOne('muxPlaybackId', q.string()),
      videoResourceId: fromVideoResource.grabOne('_id', q.string()),
      transcript: fromVideoResource.grabOne('transcript', q.string()),
      slug: ['slug.current', q.string()],
    })
    .slice(0)
    .nullable()

  console.log({groqQuery})

  return await runQuery(groqQuery)
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
