import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { EditTutorialForm } from '@/app/(content)/tutorials/_components/edit-tutorial-form'
import { courseBuilderAdapter } from '@/db'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EditTutorialPage({
	params,
}: {
	params: { module: string }
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('update', 'Content')) {
		redirect('/login')
	}

	const tutorial = await courseBuilderAdapter.getContentResource(params.module)

	if (!tutorial) {
		notFound()
	}

	console.log(`page load`, { tutorial })

	return <EditTutorialForm tutorial={tutorial} />
}
