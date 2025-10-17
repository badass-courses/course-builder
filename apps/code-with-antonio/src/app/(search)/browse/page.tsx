import LayoutClient from '@/components/layout-client'

import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
	return (
		<LayoutClient withContainer>
			<Search />
		</LayoutClient>
	)
}
