import { env } from '@/env.mjs'
import { Logger } from 'next-axiom'

export async function sanityMutation(
  mutations: any[],
  config: { returnDocuments?: boolean; revalidate?: number } = { returnDocuments: false, revalidate: 60 },
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
      body: JSON.stringify({ mutations }),
      next: { ...(config.revalidate && { revalidate: config.revalidate }) }, //seconds
    },
  )
    .then(async (response) => {
      if (response.status !== 200) {
        throw new Error(
          `Sanity mutation failed with status ${response.status}: ${response.statusText}\n\n\n${JSON.stringify(
            await response.json(),
            null,
            2,
          )})}`,
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

type SanityQueryOptions = { useCdn?: boolean; revalidate?: number; tags?: string[]; cache?: RequestCache }

const defaultSanityQueryOptions = {
  useCdn: true,
  tags: [],
  revalidate: 60,
  cache: 'default' as RequestCache,
}

export async function sanityQuery<T = any>(
  query: string,
  options: SanityQueryOptions = defaultSanityQueryOptions,
): Promise<T> {
  const log = new Logger()

  const signal = options.cache === 'no-cache' ? new AbortController().signal : undefined

  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.${options.useCdn ? 'apicdn' : 'api'}.sanity.io/v${
      env.SANITY_STUDIO_API_VERSION
    }/data/query/${env.SANITY_STUDIO_DATASET}?query=${encodeURIComponent(query)}&perspective=published`,
    {
      method: 'get',
      cache: options.cache,
      ...(signal && { signal }),
      headers: {
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
    },
  )
    .then(async (response) => {
      if (response.status !== 200) {
        throw new Error(
          `Sanity Query failed with status ${response.status}: ${response.statusText}\n\n\n${JSON.stringify(
            await response.json(),
            null,
            2,
          )})}`,
        )
      }
      const { result } = await response.json()

      return result as T
    })
    .catch((error) => {
      log.error(error)
      console.error(error)
      throw error
    })
    .finally(() => {
      log.flush()
    })
}
