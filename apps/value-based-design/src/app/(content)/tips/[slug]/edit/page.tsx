import * as React from 'react'
import { notFound } from 'next/navigation'
import { courseBuilderAdapter } from '@/db'
import { getTip } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'

import { EditTipForm } from '../../_components/edit-tip-form'

export const dynamic = 'force-dynamic'

export default async function TipEditPage({
	params,
}: {
	params: { slug: string }
}) {
	const { ability } = await getServerAuthSession()
	const tip = await getTip(params.slug)

	if (!tip || !ability.can('create', 'Content')) {
		notFound()
	}

	const resource = tip.resources?.[0]?.resource.id

	const videoResourceLoader = courseBuilderAdapter.getVideoResource(resource)

	return (
		<EditTipForm
			key={tip.id}
			tip={tip}
			videoResourceLoader={videoResourceLoader}
		/>
	)
}
