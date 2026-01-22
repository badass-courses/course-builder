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
	try {
		const workshops = await db.query.contentResource.findMany({
			where: and(eq(contentResource.type, 'workshop')),
		})

		const routeParams: { module: string; lesson: string }[] = []

		for (const workshop of workshops.filter((workshop) =>
			Boolean(workshop.fields?.slug),
		)) {
			const workshopNavigation = await getWorkshopNavigation(
				workshop.fields?.slug,
			)

			workshopNavigation?.resources?.forEach((wrapper) => {
				const resource = wrapper.resource
				if (resource.type === 'lesson' && resource.fields?.slug) {
					routeParams.push({
						module: workshop.fields?.slug,
						lesson: resource.fields.slug,
					})
				} else if (resource.type === 'section') {
					resource.resources?.forEach((sectionWrapper) => {
						const sectionResource = sectionWrapper.resource
						if (
							sectionResource.type === 'lesson' &&
							sectionResource.fields?.slug
						) {
							routeParams.push({
								module: workshop.fields?.slug,
								lesson: sectionResource.fields.slug,
							})
						}
					})
				}
			})
		}

		return routeParams
	} catch (error) {
		// If database is unavailable during build, return empty array
		// Pages will be generated on-demand instead
		console.warn(
			'Failed to generate static params for workshops, database may be unavailable:',
			error,
		)
		return []
	}
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

	// Parallelize lesson and workshop fetches
	const [lesson, workshop] = await Promise.all([
		getCachedLesson(params.lesson),
		getCachedMinimalWorkshop(params.module),
	])

	return (
		<LessonPage
			searchParams={searchParams}
			lesson={lesson}
			params={params}
			workshop={workshop}
		/>
	)
}
