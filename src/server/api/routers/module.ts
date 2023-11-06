import {z} from 'zod'
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";
import {sanityQuery} from "@/server/sanity.server";

export const moduleRouter = createTRPCRouter({
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().optional()
      }),
    )
    .query(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})

      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      return input.slug ? await sanityQuery(`*[_type == "module" && slug.current == "${input.slug}"][0]{
        ...,
        "videoResources": resources[@->._type == 'videoResource']->
      }`) : null

    }),

})
