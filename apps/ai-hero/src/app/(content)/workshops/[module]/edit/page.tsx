import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { EditWorkshopForm } from '@/app/(content)/workshops/_components/edit-workshop-form'
import LayoutClient from '@/components/layout-client'
import { getCachedMinimalWorkshop, getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
	props: {
		params: Promise<{ module: string }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: `Edit ${workshop.fields?.title}`,
	}
}
export default async function EditWorkshopPage(props: {
	params: Promise<{ module: string }>
}) {
	const params = await props.params
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		redirect('/login')
	}

	const workshop = await getWorkshop(params.module)

	if (!workshop) {
		notFound()
	}

	return (
		<LayoutClient>
			<EditWorkshopForm workshop={workshop} />
		</LayoutClient>
	)
}
