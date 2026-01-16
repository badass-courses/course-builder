import { notFound } from 'next/navigation'
import { getAuthors } from '@/lib/authors-query'
import { getServerAuthSession } from '@/server/auth'

import AuthorManagement from './author-management-client-page'

/**
 * Admin page for managing authors.
 * Authors are users with the "author" role.
 */
export default async function AuthorManagementPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('manage', 'all')) {
		notFound()
	}

	const authors = await getAuthors()
	return <AuthorManagement initialAuthors={authors} />
}
