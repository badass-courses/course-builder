import * as React from 'react'
import { notFound } from 'next/navigation'
import { WorkshopBreadcrumbs } from '@/components/breadcrumbs'
import { CourseContextSidebar } from '@/components/course-context-sidebar'
import {
	Sidebar,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { getCachedLessonWithCourse } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EditLessonLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ 'course-slug': string; 'lesson-slug': string }>
}) {
	const resolvedParams = await params
	const courseSlug = resolvedParams['course-slug']
	const lessonSlug = resolvedParams['lesson-slug']
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	const lessonWithCourse = await getCachedLessonWithCourse(
		courseSlug,
		lessonSlug,
	)

	if (!lessonWithCourse) {
		notFound()
	}

	const { course, lesson, lessons } = lessonWithCourse

	return (
		<SidebarProvider defaultOpen={true}>
			<div className="flex min-h-screen w-full">
				<Sidebar side="left" className="w-80 border-r">
					<CourseContextSidebar
						course={course}
						lessons={lessons}
						currentLessonSlug={lessonSlug}
					/>
				</Sidebar>

				<SidebarInset className="flex-1">
					<div className="flex h-full flex-col">
						{/* Header with breadcrumbs and sidebar toggle */}
						<div className="bg-background sticky top-0 z-10 border-b">
							<div className="flex items-center gap-4 p-4">
								<SidebarTrigger className="md:hidden" />
								<WorkshopBreadcrumbs
									courseTitle={course.fields?.title || ''}
									courseSlug={courseSlug}
									lessonTitle={lesson.fields?.title || ''}
								/>
							</div>
						</div>

						{/* Main content area */}
						<main className="flex-1">{children}</main>
					</div>
				</SidebarInset>
			</div>
		</SidebarProvider>
	)
}
