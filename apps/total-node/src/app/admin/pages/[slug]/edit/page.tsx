import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages-query'
import { getServerAuthSession } from '@/server/auth'

import { EditPagesForm } from '../../_components/edit-pages-form'
import { MDXPreviewProvider } from '../../_components/mdx-preview-provider'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage({
	params,
}: {
	params: { slug: string }
}) {
	headers()
	const { ability } = await getServerAuthSession()
	const page = await getPage(params.slug)

	if (!page || !ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<MDXPreviewProvider initialValue={page.fields.body}>
			<EditPagesForm key={page.fields.slug} page={page} />
		</MDXPreviewProvider>
	)
}
