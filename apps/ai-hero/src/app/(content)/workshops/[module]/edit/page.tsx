import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { EditWorkshopForm } from '@/app/(content)/workshops/_components/edit-workshop-form'
import { courseBuilderAdapter } from '@/db'
import { getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EditTutorialPage(props: {
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

	return <EditWorkshopForm workshop={workshop} />
}
