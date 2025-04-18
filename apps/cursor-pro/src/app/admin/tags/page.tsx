import { notFound } from 'next/navigation'
import { getTags } from '@/lib/tags-query'
import { getServerAuthSession } from '@/server/auth'

import TagManagement from './tag-management-client-page'

export default async function TagManagementPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('manage', 'all')) {
		notFound()
	}

	const tags = await getTags()
	return <TagManagement initialTags={tags} />
}
