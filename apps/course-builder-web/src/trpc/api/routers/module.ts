import {z} from 'zod'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/trpc/api/trpc'
import {sanityMutation, sanityQuery} from '@/server/sanity.server'
import {TRPCError} from '@trpc/server'
import groq from 'groq'
import {v4} from 'uuid'

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
        throw new TRPCError({code: 'UNAUTHORIZED'})
      }

      return input.slug
        ? await sanityQuery(`*[_type == "module" && slug.current == "${input.slug}"][0]{
        ...,
        "videoResources": resources[@->._type == 'videoResource']->
      }`)
        : null
    }),
  updateTutorial: protectedProcedure
    .input(
      z.object({
        tutorialId: z.string(),
        updateData: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          lessons: z.array(z.object({_id: z.string()})).optional(),
        }),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})

      if (!ability.can('upload', 'Media')) {
        throw new TRPCError({code: 'UNAUTHORIZED'})
      }

      const tutorial =
        await sanityQuery(groq`*[_type == "module" && _id == "${input.tutorialId}"][0]{
        _id,
        resources[]->
      }`)

      if (!tutorial) {
        throw new TRPCError({code: 'NOT_FOUND'})
      }

      return await sanityMutation(
        [
          {
            patch: {
              id: tutorial._id,
              set: {
                ...(input.updateData.title && {title: input.updateData.title}),
                ...(input.updateData.description && {
                  description: input.updateData.description,
                }),
                ...(input.updateData.lessons && {
                  resources: input.updateData.lessons.map((lesson) => {
                    return {
                      _key: v4(),
                      _type: 'reference',
                      _ref: lesson._id,
                    }
                  }),
                }),
              },
            },
          },
        ],
        {returnDocuments: true},
      )
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
        throw new TRPCError({code: 'UNAUTHORIZED'})
      }

      return await getTutorial(input.slug)
    }),
})

const getTutorial = async (slug?: string) => {
  return slug
    ? await sanityQuery<{
        _id: string
        title: string
        description: string
        lessons: {_id: string; title: string}[]
      }>(
        `*[_type == "module" && moduleType == 'tutorial' && (_id == "${slug}" || slug.current == "${slug}")][0]{
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
    : null
}
