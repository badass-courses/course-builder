import { Index, Pinecone, PineconeRecord } from '@pinecone-database/pinecone'

import { get_embedding } from '../openai'
import { get_or_create_index } from '../pinecone'

export type Concent = {
	id: string
	values: number[]
	metadata: {
		aliases: string[]
		redirect?: string
	}
}

const index: Index | undefined = await get_or_create_index({
	name: 'concepts',
	dimension: 1536,
	metric: 'cosine',
	spec: {
		serverless: {
			cloud: 'aws',
			region: 'us-west-2',
		},
	},
})

// ok, we are now using cosine similarity to identify concepts that are within .2 of the provided term. We will want to tune this figure to get a cutoff that is broad enough to capture all possible synonyms but narrow enough to filter out unrelated stuff.
export async function get_related_concepts(text: string) {
	const embedding = (await get_embedding(text)).embedding
	if (!embedding) return Promise.resolve([])

	const synonyms = (await index?.query({
		vector: embedding,
		topK: 5,
		includeMetadata: true,
	})) || { matches: [] }
	return synonyms.matches.filter((record) => record.score && record.score < 0.2)
}

export async function add_concept(text: string) {
	const embedding = (await get_embedding(text)).embedding

	if (!embedding)
		throw new Error('Unable to create embedding for concept: ' + text)

	const new_record: PineconeRecord = {
		id: text,
		values: embedding,
		metadata: {
			aliases: [],
		},
	}
	await index?.upsert([new_record])
	return new_record
}

export async function add_alias_to_concept(concept_id: string, alias: string) {
	const fetch_results = await index?.fetch([concept_id])

	const concept = fetch_results?.records[concept_id]

	if (!concept) {
		throw new Error('Concept not found')
	}

	if (!concept?.metadata) {
		concept.metadata = { aliases: [] }
	}

	concept.metadata.aliases = [...(concept.metadata.aliases as string[]), alias]

	await index?.upsert([concept])
	return concept
}
