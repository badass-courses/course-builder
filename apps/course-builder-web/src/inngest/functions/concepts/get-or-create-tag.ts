import { add_concept, get_related_concepts } from '../../../utils/vector-utils/concepts'

export async function get_or_create_tag(text: string) {
  const related_concepts = await get_related_concepts(text)

  // todo: check if the related concepts are similar enough to the text by using similarity score in query result
  // if the similarity score is high enough, return the concept
  // if the similarity score is low, create a new concept and return it
}
