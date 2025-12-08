import LayoutClient from '@/components/layout-client'

import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function BrowsePage() {
	return (
		<LayoutClient className="container border-x px-0">
			<Search />
		</LayoutClient>
	)
}
