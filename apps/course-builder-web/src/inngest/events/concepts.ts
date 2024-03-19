import exp from 'constants'

export const CONCEPT_TAGS_REQUESTED = 'concepts/tags-requested-event'
export const REQUEST_CONCEPT_SELECTION = 'concepts/request-concept-selection-event'
export const CONCEPT_SELECTED = 'concepts/concept-selected-event'
export const ADD_CONCEPT_TO_STORE = 'concepts/add-concept-to-store-event'

export type ConceptTagsRequested = {
  name: typeof CONCEPT_TAGS_REQUESTED
  data: {
    key: string
  }
}

export type RequestConceptSelection = {
  name: typeof REQUEST_CONCEPT_SELECTION
  data: {
    resource: string
    choices: string[]
  }
}

export type ConceptSelected = {
  name: typeof CONCEPT_SELECTED
  data: {
    resource: string
    choice: string
  }
}

export type AddConceptToStore = {
  name: typeof ADD_CONCEPT_TO_STORE
  data: {
    key: string
  }
}
