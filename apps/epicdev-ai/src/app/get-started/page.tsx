import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages-query'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getAllWorkshops } from '@/lib/workshops-query'
import { compileMDX } from '@/utils/compile-mdx'

import AppTourVideo from './_components/app-tour-video'
import GetStartedClient from './_components/get-started-client'
import ThemeAwareImage from './_components/theme-aware-image'
import WorkshopsComponent from './_components/workshops'

export default async function GetStartedPage() {
	const page = await getPage('get-started-6pc7h')
	if (!page) {
		notFound()
	}

	const workshops = await getAllWorkshops()

	const { content } = await compileMDX(page.fields.body || '', {
		AppTourVideo,
		Workshops: () => <WorkshopsComponent workshops={workshops} />,
		Image: ThemeAwareImage,
	})

	const pageTitle = page.fields.title || 'Get Started Using the Workshop App'
	const pageDescription =
		page.fields.description ||
		"From setting up your environment to navigating exercises and understanding the Epic Workshop App's structure, this guide ensures a smooth workshop experience."

	return (
		<GetStartedClient
			page={page}
			workshops={workshops}
			pageTitle={pageTitle}
			pageDescription={pageDescription}
		>
			{content}
		</GetStartedClient>
	)
}
