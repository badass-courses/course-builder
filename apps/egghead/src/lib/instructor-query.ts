import { InstructorProfile } from '@/lib/instructor'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { guid } from '@/utils/guid'

export const syncInstructorToSanity = async (profile: InstructorProfile) => {
	if (!profile.instructor) return
	const existingPerson = await sanityWriteClient.fetch(
		`*[_type == "person" && slug.current == "${profile.instructor.slug}"][0]`,
	)
	if (existingPerson) {
		console.log(
			`Person ${profile.instructor.slug} already exists`,
			existingPerson,
		)
		const collaborator = await sanityWriteClient.fetch(
			`*[_type == "collaborator" && eggheadInstructorId   == "${profile.instructor.id}"][0]`,
		)
		if (collaborator) {
			console.log(
				`Collaborator ${existingPerson._id} already exists`,
				collaborator,
			)
			return
		}

		await sanityWriteClient.create({
			_type: 'collaborator',
			role: 'instructor',
			title: 'instructor',
			department: 'egghead',
			eggheadInstructorId: String(profile.instructor.id),
			person: {
				_type: 'reference',
				_ref: existingPerson._id,
			},
		})
	} else {
		if (profile.instructor) {
			const personId = `person-${profile.instructor.id}-${guid()}`
			await sanityWriteClient.create({
				_id: personId,
				_type: 'person',
				name: `${profile.instructor.first_name || profile.first_name} ${profile.instructor.last_name || profile.last_name}`,
				slug: { current: profile.instructor.slug },
				image: {
					label: 'avatar',
					url: profile.instructor.avatar_480_url || profile.avatar_480_url,
				},
			})

			await sanityWriteClient.create({
				_type: 'collaborator',
				role: 'instructor',
				title: 'instructor',
				department: 'egghead',
				eggheadInstructorId: String(profile.instructor.id),
				person: {
					_type: 'reference',
					_ref: personId,
				},
			})
		}
	}
}
