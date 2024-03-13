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
  const index = await get_index('concepts')
  const synonyms = await index.query({ vector: embedding, topK: 5, includeMetadata: true, includeValues: true })
  return synonyms
}

export async function redirect(old_name: string, new_name: string) {
  const index = await get_index('concepts')
  const fetch_results = await index.fetch([old_name])

  // we recreate the entire concept using the new name as the primary key
  const concept = fetch_results.records[old_name]
  const new_concept = { ...concept, id: new_name }

  // we update the stored value to use an encoding of the new name as the primary value
  new_concept.values = (await get_embedding(new_name)).embedding

  // we remove the new id from metadata.aliases array
  if (!new_concept.metadata) {
    new_concept.metadata = { aliases: [] }
  }

  new_concept.metadata.aliases = (new_concept.metadata.aliases as string[]).filter(
    (alias: string) => alias !== new_name,
  )

  await index.upsert([concept])

  // then we add `redirect: new_name` to the old concept's metadata
  if (!concept.metadata) {
    concept.metadata = { aliases: [new_name] }
  } else {
    concept.metadata.aliases = [...(concept.metadata.aliases as string[]), new_name]
  }

  concept.metadata.redirect = new_name

  return concept
}

export async function add_concept(text) {
  const embedding = (await get_embedding(text)).embedding
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
