import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages-query'
import { getServerAuthSession } from '@/server/auth'

import { EditPagesForm } from '../../_components/edit-pages-form'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	await headers()
	const { ability } = await getServerAuthSession()
	const page = await getPage(params.slug)

	if (!page || !ability.can('create', 'Content')) {
		notFound()
	}

	return <EditPagesForm key={page.fields.slug} page={page} />
}
