import { ParsedUrlQuery } from 'querystring'
import { notFound } from 'next/navigation'
import { flagInstances, FLAGS } from '@/flags'

import { Card } from '@coursebuilder/ui'

import { FlagToggle } from '../_components/flag-toggle'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
	params: Promise<{ key: string }>
}

export default async function SingleFlagPage({ params }: PageProps) {
	const { key: paramKey } = await params
	const key = paramKey.replace('preview:', '')
	const flag = FLAGS[key as keyof typeof FLAGS]

	if (!flag) {
		return notFound()
	}

	const value = await flagInstances[key as keyof typeof flagInstances]()

	return (
		<div className="container py-8">
			<Card className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">{flag.name}</h3>
						<p className="text-muted-foreground text-sm">{flag.description}</p>
					</div>
					<FlagToggle flagKey={key} initialValue={value} />
				</div>
			</Card>
		</div>
	)
}
