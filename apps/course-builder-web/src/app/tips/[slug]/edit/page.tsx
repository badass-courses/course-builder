import * as React from 'react'
import { notFound } from 'next/navigation'
import { getTip } from '@/lib/tips-query'
import { getVideoResource } from '@/lib/video-resource-query'
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

	const videoResourceLoader = getVideoResource(resource)

	return (
		<EditTipForm
			key={tip.fields.slug}
			tip={tip}
			videoResourceLoader={videoResourceLoader}
		/>
	)
}
