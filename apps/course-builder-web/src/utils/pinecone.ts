import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone()

export async function get_index(name: string) {
  return await pc.index(name)
}
