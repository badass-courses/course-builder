import {inngest} from "@/inngest/inngest.server";
import {sanityMutation, sanityQuery} from "@/server/sanity.server";
import {POST_CREATION_REQUESTED_EVENT} from "@/inngest/events/sanity-post";
import slugify from "@sindresorhus/slugify";
import uuid from "shortid";
import {v4} from "uuid";
import {env} from "@/env.mjs";

export const postCreationRequested = inngest.createFunction(
  {id: `post-creation-requested`, name: 'Post Creation Requested'},
  {event: POST_CREATION_REQUESTED_EVENT},
  async ({event, step}) => {

    const newPostId = await step.run('create the post in Sanity', async () => {
      const postId = v4()
      await sanityMutation([
        {
          createOrReplace: {
            _id: postId,
            _type: 'post',
            title: event.data.title,
            content: event.data.content,
            slug: {
              current: slugify(`${event.data.title}~${uuid.generate()}`)
            },
            resources: [
              {
                _type: 'reference',
                _ref: event.data.requestId,
                _key: v4(),
              }
            ]
          }
        }])
      return postId
    })

    const post = await step.run('fetch the post from Sanity', async () => {
      return await sanityQuery(`*[_type == "post" && _id == "${newPostId}"][0]`)
    })

    await step.run('announce post ready', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          body: post,
          requestId: event.data.requestId,
          name: 'post.ready',
        }),
      }).catch((e) => {
        console.error(e);
      })
    })

    return {post}
  }
)

