import {env} from '@/env.mjs'
import {Logger} from 'next-axiom'
import {makeSafeQueryRunner} from 'groqd'

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
  options: {useCdn?: boolean; revalidate?: number} = {
    useCdn: true,
    revalidate: 10,
  },
): Promise<T> {
  return (await sanityQueryWithFetch(query, options)) as T
}

async function sanityQueryWithFetch(
  query: string,
  options: {useCdn?: boolean; revalidate?: number} = {
    useCdn: true,
    revalidate: 10,
  },
): Promise<any> {
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
      next: {revalidate: options.revalidate}, //seconds
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
      return result
    })
    .catch((error) => {
      log.error(error)
      throw error
    })
    .finally(() => {
      log.flush()
    })
}

// 👇 Safe query runner
export const runQuery = makeSafeQueryRunner((query) =>
  sanityQueryWithFetch(query),
)
