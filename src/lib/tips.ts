import {z} from "zod";
import {sanityQuery} from "@/server/sanity.server";

const TipSchema = z.object({
  _id: z.string(),
  _type: z.literal('explainer'),
  _updatedAt: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  videoResourceId: z.string(),
  transcript: z.string().nullable(),
  slug: z.string(),
})

type Tip = z.infer<typeof TipSchema>

export async function getTipsModule() {
  return await sanityQuery<{ tips: Tip[] }>(`*[_type == "module" && moduleType == "tips"][0]{
    "tips": coalesce(resources[@._type == 'explainer'][0]{
        _id,
        _type,
        "_updatedAt": ^._updatedAt,
        title,
        description,
        body,
        "videoResourceId": resources[@->._type == 'videoResource'][0]->_id,
        "transcript": resources[@->._type == 'videoResource'][0]->transcript,
        "slug": slug.current,
      }, [])
  }`)
}