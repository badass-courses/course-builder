import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/app/layout'
import { getCachedWorkshopWithLessons } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function CoursePage(props: {
	params: Promise<{ 'course-slug': string }>
}) {
	const params = await props.params
	const courseSlug = params['course-slug']
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	const workshopData = await getCachedWorkshopWithLessons(courseSlug)

	if (!workshopData) {
		notFound()
	}

	const { course, lessons } = workshopData

	return (
		<Layout>
			<div className="container mx-auto py-8">
				<div className="mb-8">
					<div className="mb-4">
						<Link
							href="/workshops"
							className="text-muted-foreground hover:text-foreground text-sm"
						>
							← Back to Workshops
						</Link>
					</div>
					<h1 className="text-3xl font-bold">{course.fields?.title}</h1>
					<p className="text-muted-foreground mt-2">
						{course.fields?.description}
					</p>
				</div>

				<div className="mb-6">
					<h2 className="mb-4 text-xl font-semibold">Course Lessons</h2>

					{lessons.length === 0 ? (
						<div className="py-8 text-center">
							<p className="text-muted-foreground">
								No lessons found for this course. Add lessons to get started
								with the split-view editor.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{lessons.map((lesson, index) => (
								<div
									key={lesson.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center gap-4">
										<div className="bg-muted flex h-8 w-8 items-center justify-center rounded text-sm font-medium">
											{index + 1}
										</div>
										<div>
											<h3 className="font-medium">{lesson.fields?.title}</h3>
											{lesson.fields?.description && (
												<p className="text-muted-foreground mt-1 text-sm">
													{lesson.fields.description}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="text-muted-foreground text-xs">
											{lesson.fields?.state === 'published'
												? 'Published'
												: 'Draft'}
										</div>
										<Link
											href={`/workshops/${courseSlug}/lessons/${lesson.fields?.slug}/edit`}
											className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-sm transition-colors"
										>
											Edit
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</Layout>
	)
}
