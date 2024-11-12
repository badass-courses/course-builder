import { notFound } from 'next/navigation'
import { getCachedEggheadInstructors } from '@/lib/users'
import { getServerAuthSession } from '@/server/auth'

import InstructorDataTable from '../_components/instructor-data-table'

export default async function InstructorsPage() {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		notFound()
	}
	const instructors = await getCachedEggheadInstructors()

	return (
		<>
			<h1 className="mb-8 mt-10 text-3xl font-bold text-gray-200">
				Instructors
			</h1>
			<InstructorDataTable users={instructors} />
		</>
	)
}
