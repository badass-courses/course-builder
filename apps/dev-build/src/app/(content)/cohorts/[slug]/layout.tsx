import { ContentNavigationProvider } from '@/app/(content)/_components/navigation/provider'
import { getContentNavigation } from '@/lib/content-navigation-query'

export default async function CohortLayout(props: {
	params: Promise<{ slug: string }>
	children: React.ReactNode
}) {
	const params = await props.params
	return (
		<ContentNavigationProvider
			navigationDataLoader={getContentNavigation(params.slug)}
		>
			{props.children}
		</ContentNavigationProvider>
	)
}
