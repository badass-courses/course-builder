import { Logger } from 'next-axiom'

type SanityQueryOptions = {
	useCdn?: boolean
	revalidate?: number
	tags?: string[]
	cache?: RequestCache
}

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

	const signal =
		options.cache === 'no-cache' ? new AbortController().signal : undefined

	return await fetch(
		`https://${process.env.SANITY_STUDIO_PROJECT_ID}.${
			options.useCdn ? 'apicdn' : 'api'
		}.sanity.io/v${process.env.SANITY_STUDIO_API_VERSION}/data/query/${
			process.env.SANITY_STUDIO_DATASET
		}?query=${encodeURIComponent(query)}&perspective=published`,
		{
			method: 'get',
			cache: options.cache,
			...(signal && { signal }),
			headers: {
				Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
			},
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
