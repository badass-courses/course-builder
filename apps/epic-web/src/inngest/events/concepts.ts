export const CONCEPT_TAGS_REQUESTED = 'concepts/tags-requested-event'
export const REQUEST_CONCEPT_SELECTION =
	'concepts/request-concept-selection-event'
export const CONCEPT_SELECTED = 'concepts/concept-selected-event'

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
