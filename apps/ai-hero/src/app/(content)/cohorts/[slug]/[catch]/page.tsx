import { redirect } from 'next/navigation'

export default async function CohortCatchAllPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	return redirect(`/cohorts/${slug}`)
}
