'use server'

import { eggheadPgQuery } from '@/db/eggheadPostgres'

/**
 * Adds an instructor role to a user in egghead Database
 * @param userId - The user's ID
 */
const INSTRUCTOR_ROLE_ID = 8

export async function addInstructorRoleToEggheadUser({
	userId,
}: {
	userId: string
}) {
	const instructorRoleQuery = `
    INSERT INTO users_roles (user_id, role_id)
    VALUES ($1, $2)
  `

	await eggheadPgQuery(instructorRoleQuery, [userId, INSTRUCTOR_ROLE_ID])
}

/**
 * Creates a new instructor in egghead Database
 * @param userId - The user's ID
 * @param email - The user's email
 * @param firstName - The user's first name
 * @param lastName - The user's last name
 * @param twitter - The user's Twitter handle
 * @param website - The user's website
 * @param bio - The user's bio
 * @param profileImageUrl - The user's profile image URL
 * @returns The created instructor's ID
 */
export async function createEggheadInstructor({
	userId,
	email,
	firstName,
	lastName,
	twitter,
	website,
	bio,
	profileImageUrl,
}: {
	userId: string
	firstName: string
	lastName: string
	email: string
	twitter: string
	website: string
	bio: string
	profileImageUrl: string
}) {
	// add instructor to egghead user
	const columns = [
		'first_name',
		'last_name',
		'slug',
		'user_id',
		'email',
		'twitter',
		'website',
		'state',
		'bio_short',
		'profile_picture_url',
	]

	const values = [
		firstName,
		lastName,
		`${firstName}-${lastName}`,
		userId,
		email,
		twitter,
		website,
		'invited',
		bio,
		profileImageUrl,
	]

	const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')

	const query = `
    INSERT INTO instructors (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING id
  `

	const eggheadInstructorResult = await eggheadPgQuery(query, values)

	return eggheadInstructorResult.rows[0].id
}

/**
 * Adds a revenue split to an instructor in egghead Database
 * @param eggheadInstructorId - The instructor's ID
 */
export async function addRevenueSplitToEggheadInstructor({
	eggheadInstructorId,
}: {
	eggheadInstructorId: string
}) {
	const revenueSplitQuery = `
    INSERT INTO instructor_revenue_splits (
      instructor_id,
      credit_to_instructor_id,
      percentage,
      from_date
    ) VALUES (
      $1,
      $2,
      $3,
      $4
    );
  `

	await eggheadPgQuery(revenueSplitQuery, [
		eggheadInstructorId,
		null,
		0.2,
		new Date(),
	])
}
