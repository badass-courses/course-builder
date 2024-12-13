import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { invites } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'

import { InviteInstructorForm } from './_components/invite-instructor-form'
import InvitesDataTable from './_components/invites-data-table'

export default async function InstructorsPage() {
	const { ability } = await getServerAuthSession()
	if (!ability.can('manage', 'all')) {
		notFound()
	}
	const instructorInvites = await db.select().from(invites)

	return (
		<>
			<h1 className="mb-8 mt-10 text-3xl font-bold text-gray-800 dark:text-gray-200">
				Instructor Invites
			</h1>
			<InviteInstructorForm />
			<hr className="my-8" />
			<Suspense fallback={<div>Loading...</div>}>
				<InvitesDataTable invites={instructorInvites} />
			</Suspense>
		</>
	)
}
