import {env} from '@/env.mjs'

export async function sanityMutation(
  mutations: any[],
  config: {returnDocuments: boolean} = {returnDocuments: false},
) {
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.api.sanity.io/v${env.SANITY_STUDIO_API_VERSION}/data/mutate/${env.SANITY_STUDIO_DATASET}?returnDocuments=${config.returnDocuments}`,
    {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
      body: JSON.stringify({mutations}),
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
      console.log(error)
      throw error
    })
}

export async function sanityQuery<T = any>(query: string): Promise<T> {
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.apicdn.sanity.io/v${
      env.SANITY_STUDIO_API_VERSION
    }/data/query/${env.SANITY_STUDIO_DATASET}?query=${encodeURIComponent(
      query,
    )}&perspective=published`,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
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
      const {result} = await response.json()
      return result as T
    })
    .catch((error) => {
      console.log(error)
      throw error
    })
}
