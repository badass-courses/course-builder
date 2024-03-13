import OpenAI from 'openai'
import { Embedding } from 'openai/resources'

const openai = new OpenAI()

export async function get_embedding(text: string): Promise<Embedding> {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })

  return embedding.data[0]
}
