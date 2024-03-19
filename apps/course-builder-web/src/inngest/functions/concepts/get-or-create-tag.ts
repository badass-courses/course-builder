import { inngest } from '@/inngest/inngest.server'

import { add_concept, get_related_concepts } from '../../../utils/vector-utils/concepts'
import { ADD_CONCEPT_TO_STORE, CONCEPT_TAGS_REQUESTED } from '../../events/concepts'

export const getOrCreateConcept = inngest.createFunction(
  { id: `getOrCreateConcept`, name: 'Get or Create Concept' },
  {
    event: CONCEPT_TAGS_REQUESTED,
  },
  async ({ event, step }) => {
    let new_concept
    let related_concepts

    related_concepts = await step.run('check for similar concepts', async () => {
      return await get_related_concepts(event.data.key)
    })

    if (related_concepts.length > 0) {
      console.log(
        "We have some potential matches, we shouldn't write to the database until we're sure none of these are a better fit.",
      )
      console.log('The score is based on cosine similarity, so the closer to 1 the better the match.')
      console.dir(related_concepts)
    } else {
      await step.run('create new concept', async () => {
        console.log('Adding new concept [' + event.data.key + ']!')
        new_concept = await add_concept(event.data.key)
      })
    }

    return { new_concept, related_concepts }
  },
)

export const addConcept = inngest.createFunction(
  {
    id: `addConcept`,
    name: 'Add Concept',
  },
  {
    event: ADD_CONCEPT_TO_STORE,
  },
  async ({ event, step }) => {
    const new_concept = await step.run('create new concept', async () => {
      return await add_concept(event.data.key)
    })

    return { new_concept }
  },
)
