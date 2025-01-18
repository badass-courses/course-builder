import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getList } from '@/lib/lists-query'
import { getTags } from '@/lib/tags-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditListForm } from './_components/edit-list-form'

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
	const list = await getList(params.slug)

	if (!list) {
		return parent as Metadata
	}

	return {
		title: `📝 ${list.fields.title}`,
	}
}

export default async function ListEditPage(props: {
	params: Promise<{ slug: string }>
}) {
	const params = await props.params
	const tagLoader = getTags()
	const { ability } = await getServerAuthSession()
	const list = await getList(params.slug)

	if (!list || !ability.can('create', 'Content')) {
		notFound()
	}

	if (ability.cannot('manage', subject('Content', list))) {
		redirect(`/${list?.fields?.slug}`)
	}

	return (
		<EditListForm
			tagLoader={tagLoader}
			key={list.fields.slug}
			list={{ ...list }}
		/>
	)
}
