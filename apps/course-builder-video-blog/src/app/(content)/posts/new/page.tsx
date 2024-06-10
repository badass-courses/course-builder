import * as React from 'react'
import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

import { CreatePost } from '../_components/create-post'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<CreatePost />
		</div>
	)
}
