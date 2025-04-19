import { notFound } from 'next/navigation'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div>
			<CreateResourcePage resourceType={'event'} />
		</div>
	)
}
