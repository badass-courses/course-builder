import { type List } from '@/lib/lists'

export function getNextUpResourceFromList(
	list: List,
	currentResourceId: string,
) {
	if (list?.fields?.type !== 'nextUp') return null

	const currentResourceIndexFromList = list?.resources.findIndex(
		(r) => r.resource.id === currentResourceId,
	)
	const nextUpIndex = currentResourceIndexFromList + 1
	const nextUpResource = list?.resources?.[nextUpIndex]

	return nextUpResource || null
}
