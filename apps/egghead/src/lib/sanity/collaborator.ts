'use server'

import { getEggheadUserProfile } from '@/lib/egghead'
import { sanityWriteClient } from '@/server/sanity-write-client'

import type { SanityCollaborator, SanityReference } from './types'
import { createSanityReference } from './utils'

// Define a more specific SanityDocument type for collaborators
type SanityCollaboratorDocument = {
	_id: string
	_type: string
	eggheadInstructorId: string
	title: string
	role: string
}

// Type for creating a new collaborator (without _id)
type NewSanityCollaborator = Omit<SanityCollaboratorDocument, '_id'> & {
	_id?: string
}

/**
 * Gets a Sanity collaborator document for an Egghead instructor ID
 * @param instructorId - The ID of the Egghead instructor
 * @param role - The role of the collaborator (default: "instructor")
 * @param returnReference - Whether to return a reference to the collaborator (default: true)
 * @returns The Sanity collaborator document or reference
 */
export async function getSanityCollaborator(
	instructorId: number,
	role: string = 'instructor',
	returnReference = true,
): Promise<SanityReference | SanityCollaboratorDocument | null> {
	// Check if collaborator exists
	const existingCollaborator =
		await sanityWriteClient.fetch<SanityCollaboratorDocument | null>(
			`*[_type == "collaborator" && eggheadInstructorId == $instructorId][0]`,
			{ instructorId: instructorId.toString() },
		)

	if (existingCollaborator) {
		return returnReference
			? createSanityReference(existingCollaborator._id)
			: existingCollaborator
	}

	// Get egghead user profile to create collaborator
	const eggheadUser = await getEggheadUserProfile(instructorId.toString())

	if (!eggheadUser) {
		throw new Error(`Egghead user profile with id ${instructorId} not found.`)
	}

	// Create the collaborator
	const collaborator = await sanityWriteClient.create<NewSanityCollaborator>({
		_type: 'collaborator',
		eggheadInstructorId: instructorId.toString(),
		title: eggheadUser?.full_name || '',
		role,
	})

	return returnReference
		? createSanityReference(collaborator._id)
		: (collaborator as SanityCollaboratorDocument)
}

/**
 * Syncs an instructor to Sanity
 * @param userId - The ID of the user
 * @param instructorId - The ID of the instructor
 * @returns The Sanity collaborator document or reference
 */
export async function syncInstructorToSanity(
	userId: string,
	instructorId: number,
) {
	return await getSanityCollaborator(instructorId)
}
