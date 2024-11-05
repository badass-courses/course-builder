import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import ModuleEdit from '@/app/(content)/tutorials/[module]/edit/_components/module-edit'
import { courseBuilderAdapter } from '@/db'
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

	const tutorial = await courseBuilderAdapter.getContentResource(params.module)

	if (!tutorial) {
		notFound()
	}

	return (
		<>
			<ModuleEdit tutorial={tutorial} />
		</>
	)
}
