import { sanityWriteClient } from '@/server/sanity-write-client'

import {
	createSanityReference,
	systemFieldsProjection,
} from '../utils/projections'
import { SanityCollaborator, SanityCollaboratorSchema } from './schemas'

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

export const fetchAllCollaborators = sanityWriteClient.fetch(`
  *[_type == "collaborator"] {
    ${collaboratorProjection}
  }
`)

export const fetchCollaboratorById = (id: string) =>
	sanityWriteClient.fetch(`
  *[_type == "collaborator" && _id == "${id}"][0] {
    ${collaboratorProjection}
  }
`)

export async function getSanityCollaborator(
	instructorId: number,
	role: SanityCollaborator['role'] = 'instructor',
	returnReference = true,
) {
	const collaboratorData = await sanityWriteClient.fetch(
		`*[_type == "collaborator" && eggheadInstructorId == "${instructorId}" && role == "${role}"][0]`,
	)

	const collaborator =
		SanityCollaboratorSchema.nullable().parse(collaboratorData)

	if (!collaborator || !collaborator._id) return null

	return returnReference
		? createSanityReference(collaborator._id)
		: collaborator
}

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
