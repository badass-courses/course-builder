import LayoutClient from '@/components/layout-client'

import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
	return (
		<LayoutClient withContainer>
			<main className="container flex min-h-screen flex-col items-center gap-5 py-10">
				<h1 className="mb-4 text-xl sm:text-3xl">Search</h1>
				<div className="mx-auto w-full max-w-4xl border-t">
					<Search />
				</div>
			</main>
		</LayoutClient>
	)
}
