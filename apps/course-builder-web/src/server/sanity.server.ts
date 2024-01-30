import {env} from '@/env.mjs'
import {Logger} from 'next-axiom'

export async function sanityMutation(
  mutations: any[],
  config: {returnDocuments: boolean} = {returnDocuments: false},
) {
  const log = new Logger()
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.api.sanity.io/v${env.SANITY_STUDIO_API_VERSION}/data/mutate/${env.SANITY_STUDIO_DATASET}?returnDocuments=${config.returnDocuments}`,
    {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
      body: JSON.stringify({mutations}),
      next: {revalidate: 60}, //seconds
    },
  )
    .then(async (response) => {
      if (response.status !== 200) {
        throw new Error(
          `Sanity mutation failed with status ${response.status}: ${
            response.statusText
          }\n\n\n${JSON.stringify(await response.json(), null, 2)})}`,
        )
      }
      return response.json()
    })
    .catch((error) => {
      log.error(error)
      throw error
    })
    .finally(() => {
      log.flush()
    })
}

export async function sanityQuery<T = any>(
  query: string,
  options: {useCdn?: boolean; revalidate?: number; tags: string[]} = {
    useCdn: true,
    revalidate: 10,
    tags: [],
  },
): Promise<T> {
  const log = new Logger()
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.${
      options.useCdn ? 'apicdn' : 'api'
    }.sanity.io/v${env.SANITY_STUDIO_API_VERSION}/data/query/${
      env.SANITY_STUDIO_DATASET
    }?query=${encodeURIComponent(query)}&perspective=published`,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
      next: {revalidate: options.revalidate, tags: options.tags}, //seconds
    },
  )
    .then(async (response) => {
      if (response.status !== 200) {
        throw new Error(
          `Sanity Query failed with status ${response.status}: ${
            response.statusText
          }\n\n\n${JSON.stringify(await response.json(), null, 2)})}`,
        )
      }
      const {result} = await response.json()
      return result as T
    })
    .catch((error) => {
      log.error(error)
      throw error
    })
    .finally(() => {
      log.flush()
    })
}
