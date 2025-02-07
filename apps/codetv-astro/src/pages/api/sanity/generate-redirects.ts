import { createClient } from '@sanity/client'
import type { APIRoute } from 'astro'
import { SANITY_SECRET_TOKEN } from 'astro:env/server'
import groq from 'groq'

import { type GetEpisodeSlugQueryResult } from '../../../types/sanity'

const client = createClient({
	projectId: 'vnkupgyb',
	dataset: 'develop',
	apiVersion: '2024-08-10',
	token: SANITY_SECRET_TOKEN,
	useCdn: true,
})

const getEpisodeSlugQuery = groq`
  *[_type == "collection" && series->slug.current == "learn-with-jason"] {
    "newSlugBase": "/series/" + series->slug.current + "/" + slug.current,
      episodes[]-> {
        "oldSlug": "/" + slug.current
      }
  }
`

export const GET: APIRoute = async ({ request }) => {
	const data = await client.fetch<GetEpisodeSlugQueryResult>(
		getEpisodeSlugQuery,
		{},
	)

	const redirects = data.flatMap(({ newSlugBase, episodes }) => {
		return episodes?.map(
			({ oldSlug }) =>
				`${oldSlug}\t\thttps://codetv.dev${newSlugBase}${oldSlug} 301!`,
		)
	})

	return new Response(redirects.join('\n'), {
		headers: {
			'Content-Type': 'text/plain',
		},
	})
}
