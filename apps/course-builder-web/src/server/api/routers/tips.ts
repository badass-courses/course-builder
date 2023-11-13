import {z} from 'zod'
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";
import {getTipsModule} from "@/lib/tips";
import {sanityMutation} from "@/server/sanity.server";
import {v4} from "uuid";

function toChicagoTitleCase(slug: string): string {
  const minorWords: Set<string> = new Set(['and', 'but', 'for', 'or', 'nor', 'the', 'a', 'an', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'per', 'to']);

  return slug
    .replace(/-/g, ' ')
    .split(' ')
    .map((word, index, array) => {
      if (
        index > 0 &&
        index < array.length - 1 &&
        minorWords.has(word.toLowerCase())
      ) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(' ');
}

export const tipsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        videoResourceId: z.string(),
        description: z.string()
      }),
    )
    .mutation(async ({ctx, input}) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      const newTipId = v4()

      await sanityMutation( [
        {"createOrReplace": {
            "_id": newTipId,
            "_type": "tip",
            "title": toChicagoTitleCase(input.videoResourceId),
            "resources": [
              {
                "_key": v4(),
                "_type": "reference",
                "_ref": input.videoResourceId
              }
            ],
            "summary": input.description,
          }}
      ])

      const tipsModule = await getTipsModule()

      await sanityMutation([
        {"patch": {
            "id": tipsModule._id,
            "setIfMissing": {"resources": []},
            "insert": {
              "before": "resources[0]",
              "items": [
                {
                  "_key": v4(),
                  "_type": "reference",
                  "_ref": newTipId
                }
              ]
            }
          }}
      ])

      return await getTipsModule()
    })
})
