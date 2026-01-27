import { ContentNavigationProvider } from '@/app/(content)/_components/navigation/provider'
import { getCachedCohort } from '@/lib/cohorts-query'
import { getContentNavigation } from '@/lib/content-navigation-query'

export default async function CohortLayout(props: {
	params: Promise<{ slug: string }>
	children: React.ReactNode
}) {
	const params = await props.params
	return (
		<ContentNavigationProvider
			navigationDataLoader={(async () => {
				const cohort = await getCachedCohort(params.slug)
				if (!cohort) return null
				return getContentNavigation(cohort.id, {
					caller: 'layout.cohort',
					depth: 1,
				})
			})()}
		>
			{props.children}
		</ContentNavigationProvider>
	)
}
