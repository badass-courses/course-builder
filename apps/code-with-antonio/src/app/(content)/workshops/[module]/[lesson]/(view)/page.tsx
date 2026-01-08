import type { Metadata, ResolvingMetadata } from 'next'
import { LessonPage } from '@/app/(content)/workshops/[module]/[lesson]/(view)/shared-page'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getCachedLesson } from '@/lib/lessons-query'
import {
	getCachedMinimalWorkshop,
	getWorkshopNavigation,
} from '@/lib/workshops-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'

export async function generateStaticParams() {
	console.error(
		'[generateStaticParams] [lesson] Starting to generate static params for lesson pages',
	)

	const workshops = await db.query.contentResource.findMany({
		where: and(eq(contentResource.type, 'workshop')),
	})

	console.error(
		`[generateStaticParams] [lesson] Found ${workshops.length} workshops total`,
	)

	const routeParams: { module: string; lesson: string }[] = []
	const workshopsWithSlugs = workshops.filter((workshop) =>
		Boolean(workshop.fields?.slug),
	)

	console.error(
		`[generateStaticParams] [lesson] Processing ${workshopsWithSlugs.length} workshops with slugs`,
	)

	for (const workshop of workshopsWithSlugs) {
		const workshopSlug = workshop.fields?.slug
		const workshopId = workshop.id

		console.error(
			`[generateStaticParams] [lesson] Processing workshop: ${workshopSlug} (id: ${workshopId})`,
		)

		try {
			const startTime = Date.now()
			const workshopNavigation = await getWorkshopNavigation(workshopSlug)
			const duration = Date.now() - startTime

			console.error(
				`[generateStaticParams] [lesson] ✅ Successfully fetched navigation for ${workshopSlug} in ${duration}ms`,
			)
			console.error(
				`[generateStaticParams] [lesson] Navigation has ${workshopNavigation?.resources?.length || 0} top-level resources`,
			)

			workshopNavigation?.resources?.forEach((wrapper) => {
				const resource = wrapper.resource
				if (resource.type === 'lesson') {
					routeParams.push({
						module: workshopSlug,
						lesson: resource.fields?.slug,
					})
				} else if (resource.type === 'section') {
					console.error(
						`[generateStaticParams] [lesson] Found section with ${resource.resources?.length || 0} nested resources`,
					)
					resource.resources?.forEach((sectionWrapper) => {
						const sectionResource = sectionWrapper.resource
						if (sectionResource.type === 'lesson') {
							routeParams.push({
								module: workshopSlug,
								lesson: sectionResource.fields?.slug,
							})
						}
					})
				}
			})

			console.error(
				`[generateStaticParams] [lesson] Generated ${routeParams.length} total route params so far`,
			)
		} catch (error) {
			console.error(
				`[generateStaticParams] [lesson] ❌ ERROR processing workshop ${workshopSlug} (id: ${workshopId}):`,
				error,
			)
			console.error(`[generateStaticParams] [lesson] Error details:`, {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				workshopSlug,
				workshopId,
			})
			// Continue processing other workshops
		}
	}

	console.error(
		`[generateStaticParams] [lesson] ✅ Completed. Generated ${routeParams.length} total route params`,
	)
	return routeParams
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const lesson = await getCachedLesson(params.lesson)

	if (!lesson) {
		return parent as Metadata
	}

	return {
		title: lesson.fields?.title,
		description: lesson.fields?.description,
		openGraph: {
			images: [getOGImageUrlForResource(lesson)],
		},
	}
}

type Props = {
	params: Promise<{ lesson: string; module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LessonPageWrapper(props: Props) {
	const searchParams = await props.searchParams
	const params = await props.params
	const lesson = await getCachedLesson(params.lesson)
	const workshop = await getCachedMinimalWorkshop(params.module)

	return (
		<LessonPage
			searchParams={searchParams}
			lesson={lesson}
			params={params}
			workshop={workshop}
		/>
	)
}
