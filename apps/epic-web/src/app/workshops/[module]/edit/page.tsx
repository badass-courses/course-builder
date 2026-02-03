import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getWorkshop } from '@/lib/workshops/workshops.service'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'

import { EditWorkshopForm } from '../../_components/edit-workshop-form'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const { ability } = await getServerAuthSession()
	const workshop = await getWorkshop(params.module, ability)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: `📝 ${workshop.fields.title}`,
	}
}

export default async function WorkshopEditPage(props: {
	params: Promise<{ module: string }>
}) {
	const params = await props.params

	console.log('params', params)

	const { ability } = await getServerAuthSession()
	const workshop = await getWorkshop(params.module, ability)

	if (!workshop || !ability.can('create', 'Content')) {
		notFound()
	}

	if (ability.cannot('manage', subject('Content', workshop))) {
		redirect(`/workshops/${workshop?.fields?.slug}`)
	}

	return (
		<EditWorkshopForm key={workshop.fields.slug} workshop={{ ...workshop }} />
	)
}
