import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {createTRPCRouter, publicProcedure} from '@/trpc/api/trpc'
import {sanityQuery} from '@/server/sanity.server'

export const moduleRouter = createTRPCRouter({
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})

      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      return input.slug
        ? await sanityQuery(`*[_type == "module" && slug.current == "${input.slug}"][0]{
        ...,
        "videoResources": resources[@->._type == 'videoResource']->
      }`)
        : null
    }),
  getTutorial: publicProcedure
    .input(
      z.object({
        slug: z.string().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})

      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      return await sanityQuery<{
        title: string
        description: string
        lessons: {_id: string; title: string}[]
      }>(
        `*[_type == "module" && moduleType == 'tutorial' && (_id == "${input.slug}" || slug.current == "${input.slug}")][0]{
      ...,
      "lessons": resources[@->.moduleType == "lesson"]->{
       _id,
       _type,
       state,
       moduleType,
       "slug": slug.current,
       title,
       body,
       image,
       ogImage,
       "muxPlaybackId": resources[@->._type == 'videoResource'][0]->.muxPlaybackId,
       "duration": resources[@->._type == 'videoResource'][0]->.duration,
       "transcript": resources[@->._type == 'videoResource'][0]->.transcript,
      }
    }`,
      )
    }),
})
