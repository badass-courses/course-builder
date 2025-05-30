'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function switchOrganization(organizationId: string) {
	const cookieStore = await cookies()
	cookieStore.set('organizationId', organizationId)

	// Force a redirect to ensure middleware runs and sets the header
	redirect('/organization-list')
}
