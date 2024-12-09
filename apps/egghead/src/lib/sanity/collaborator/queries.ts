import { sanityWriteClient } from '@/server/sanity-write-client'

import { systemFieldsProjection } from '../utils/projections'
import { SanityCollaborator } from './schemas'

const collaboratorProjection = `
  ${systemFieldsProjection},
  person,
  title,
  eggheadInstructorId,
  role,
  department,
  _createdAt,
  _updatedAt
`

export const fetchAllCollaborators = `
  *[_type == "collaborator"] {
    ${collaboratorProjection}
  }
`

export const fetchCollaboratorById = (id: string) => `
  *[_type == "collaborator" && _id == "${id}"][0] {
    ${collaboratorProjection}
  }
`

export const createCollaborator = async (
	collaborator: Partial<SanityCollaborator>,
) => {
	return await sanityWriteClient.create({
		_type: 'collaborator',
		...collaborator,
	})
}

export const updateCollaborator = async (
	id: string,
	updates: Partial<SanityCollaborator>,
) => {
	return await sanityWriteClient.patch(id).set(updates).commit()
}

export const deleteCollaborator = async (id: string) => {
	return await sanityWriteClient.delete(id)
}
