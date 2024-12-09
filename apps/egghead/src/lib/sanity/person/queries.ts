import { sanityWriteClient } from '@/server/sanity-write-client'

import { systemFieldsProjection } from '../utils/projections'
import { SanityPerson } from './schemas'

const personProjection = `
  ${systemFieldsProjection},
  name,
  slug,
  twitter,
  website,
  image,
  _createdAt,
  _updatedAt
`

export const fetchAllPersons = `
  *[_type == "person"] {
    ${personProjection}
  }
`

export const fetchPersonById = (id: string) => `
  *[_type == "person" && _id == "${id}"][0] {
    ${personProjection}
    _updatedAt
  }
`

export const createPerson = async (person: Partial<SanityPerson>) => {
	return await sanityWriteClient.create({
		_type: 'person',
		...person,
	})
}

export const updatePerson = async (
	id: string,
	updates: Partial<SanityPerson>,
) => {
	return await sanityWriteClient.patch(id).set(updates).commit()
}

export const deletePerson = async (id: string) => {
	return await sanityWriteClient.delete(id)
}
