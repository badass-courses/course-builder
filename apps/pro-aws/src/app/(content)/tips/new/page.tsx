import * as React from 'react'
import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

import { CreateTip } from '../_components/create-tip'

export const dynamic = 'force-dynamic'

export default async function NewTipPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<CreateTip />
		</div>
	)
}
