import Search from './_components/search'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
	return (
		<main className="container max-w-4xl py-5 sm:py-10">
			<Search />
		</main>
	)
}
