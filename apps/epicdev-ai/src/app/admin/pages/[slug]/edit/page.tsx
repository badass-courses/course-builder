import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import LayoutClient from '@/components/layout-client'
import { getPage } from '@/lib/pages-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditPagesForm } from '../../_components/edit-pages-form'
import { MDXPreviewProvider } from '../../_components/mdx-preview-provider'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const page = await getPage(params.slug)

	if (!page) {
		return parent as Metadata
	}

	return {
		title: `📄 ${page.fields.title}`,
	}
}

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

	if (ability.cannot('manage', subject('Content', page))) {
		redirect(`/${page?.fields?.slug}`)
	}

	return (
		<LayoutClient>
			<MDXPreviewProvider initialValue={page.fields.body}>
				<div className="border-t">
					<EditPagesForm key={page.fields.slug} page={{ ...page }} />
				</div>
			</MDXPreviewProvider>
		</LayoutClient>
	)
}
