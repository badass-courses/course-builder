import LayoutClient from '@/components/layout-client'
import { getSaleBannerDataFromSearchParams } from '@/lib/sale-banner'

import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function BrowsePage(props: {
	searchParams: Promise<{ [key: string]: string | undefined }>
}) {
	const searchParams = await props.searchParams
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)

	return (
		<LayoutClient
			saleBannerData={saleBannerData}
			className="container border-x px-0"
		>
			<Search />
		</LayoutClient>
	)
}
