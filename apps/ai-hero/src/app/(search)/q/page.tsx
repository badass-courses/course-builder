import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
	return (
		<main className="container flex min-h-screen flex-col items-center gap-5 py-10">
			<h1 className="fluid-3xl mb-4">Search</h1>
			<div className="mx-auto w-full max-w-4xl border-t">
				<Search />
			</div>
		</main>
	)
}
