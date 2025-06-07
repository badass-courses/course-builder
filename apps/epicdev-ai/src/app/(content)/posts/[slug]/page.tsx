import { redirect } from 'next/navigation'

type PageProps = {
	params: Promise<{ slug: string }>
}

export default async function PostRedirectPage({ params }: PageProps) {
	const slug = (await params).slug
	redirect(`/${slug}`)
}
