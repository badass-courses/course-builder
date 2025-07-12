import React from 'react'
import { redirect } from 'next/navigation'
import { getImpersonatedSession } from '@/server/auth'

import DashboardComponent from './_components/dashboard-component'

export default async function DashboardPage() {
	const { session } = await getImpersonatedSession()

	if (!session?.user) {
		redirect('/login')
	}

	return <DashboardComponent user={session.user} />
}
