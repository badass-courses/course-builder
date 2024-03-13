import { PineconeRecord } from '@pinecone-database/pinecone'

import { get_embedding } from '../openai'
import { get_index } from '../pinecone'

export type Concent = {
  id: string
  values: number[]
  metadata: {
    aliases: string[]
    redirect?: string
  }
}

export async function get_related_concepts(text: string) {
  const embedding = (await get_embedding(text)).embedding
  if (!embedding) return Promise.resolve([])

  const index = await get_index('concepts')
  const synonyms = await index.query({ vector: embedding, topK: 5, includeMetadata: true, includeValues: true })
  return synonyms
}

export async function add_concept(text) {
  const embedding = (await get_embedding(text)).embedding

  if (!embedding) throw new Error('Unable to create embedding for concept: ' + text)

  const index = await get_index('concepts')
  const new_record: PineconeRecord = {
    id: text,
    values: embedding,
    metadata: {
      aliases: [],
    },
  }
  await index.upsert([new_record])
  return new_record
}

export async function add_alias_to_concept(concept_id: string, alias: string) {
  const index = await get_index('concepts')
  const fetch_results = await index.fetch([concept_id])

  const concept = fetch_results.records[concept_id]
  if (!concept?.metadata) {
    concept.metadata = { aliases: [] }
  }

  concept.metadata.aliases = [...(concept.metadata.aliases as string[]), alias]

  await index.upsert([concept])
  return concept
}
