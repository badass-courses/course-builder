import {env} from '@/env.mjs'

export async function sanityMutation(mutations: any[]) {
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.api.sanity.io/v${env.SANITY_STUDIO_API_VERSION}/data/mutate/${env.SANITY_STUDIO_DATASET}`,
    {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
      body: JSON.stringify({mutations}),
    },
  ).then((response) => response.json())
}

export async function sanityQuery<T = any>(query: string): Promise<T> {
  return await fetch(
    `https://${env.SANITY_STUDIO_PROJECT_ID}.api.sanity.io/v${
      env.SANITY_STUDIO_API_VERSION
    }/data/query/${env.SANITY_STUDIO_DATASET}?query=${encodeURIComponent(
      query,
    )}`,
    {
      method: 'get',
      headers: {
        Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
      },
    },
  )
    .then(async (response) => {
      const {result} = await response.json()
      return result as T
    })
    .catch((error) => {
      console.log(error)
      throw error
    })
}
