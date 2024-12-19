import { env } from '@/env.mjs'
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

export const typsenseAdapterConfig: {
	server: ConfigurationOptions
	additionalSearchParameters: Record<string, string>
} = {
	server: {
		apiKey: env.NEXT_PUBLIC_TYPESENSE_API_KEY ?? '', // Be sure to use an API key that only allows search operations
		nodes: [
			{
				host: env.NEXT_PUBLIC_TYPESENSE_HOST ?? 'test',
				path: '',
				port: Number(env.NEXT_PUBLIC_TYPESENSE_PORT) ?? 8108,
				protocol: 'https',
			},
		],
		cacheSearchResultsForSeconds: 2 * 60,
	},
	// The following parameters are directly passed to Typesense's search API endpoint.
	//  So you can pass any parameters supported by the search endpoint below.
	//  query_by is required.
	additionalSearchParameters: {
		query_by: 'title,description',
		preset: 'updated_at_timestamp',
	},
}

// _eval([ (type:playlist):4, (type:lesson):3, (type:podcast):2], (type:talk):1):desc,published_at_timestamp:desc,rank:asc

export const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter(
	typsenseAdapterConfig,
)

export const TYPESENSE_COLLECTION_NAME =
	env.TYPESENSE_COLLECTION_NAME || 'content_production'
