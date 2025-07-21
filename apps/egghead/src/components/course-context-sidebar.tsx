'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Post } from '@/lib/posts'
import { cn } from '@/utils/cn'
import { ArrowLeft, BookOpen, Edit, Eye } from 'lucide-react'

interface CourseContextSidebarProps {
	course: Post
	lessons: Post[]
	currentLessonSlug?: string
}

export function CourseContextSidebar({
	course,
	lessons,
	currentLessonSlug,
}: CourseContextSidebarProps) {
	const router = useRouter()
	const params = useParams()
	const courseSlug = params['course-slug'] as string

	const handleLessonClick = (lessonSlug: string) => {
		// Navigate to the lesson edit page
		router.push(`/workshops/${courseSlug}/lessons/${lessonSlug}/edit`)
	}

	return (
		<SidebarContent>
			<SidebarHeader className="border-b pb-4">
				<div className="flex items-center gap-3">
					<Link
						href="/workshops"
						className="text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="min-w-0 flex-1">
						<Link
							href={`/workshops/${courseSlug}`}
							className="hover:text-foreground block"
						>
							<h2 className="truncate text-sm font-semibold">
								{course.fields?.title}
							</h2>
						</Link>
						{course.fields?.description && (
							<p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
								{course.fields.description}
							</p>
						)}
					</div>
				</div>
			</SidebarHeader>

			<SidebarGroup>
				<SidebarGroupLabel>
					<div className="flex w-full items-center justify-between">
						<span>Course Lessons</span>
						<span className="text-muted-foreground text-xs">
							{lessons.length}
						</span>
					</div>
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{lessons.length === 0 ? (
							<div className="px-2 py-4 text-center">
								<p className="text-muted-foreground text-xs">
									No lessons yet. Add lessons to this course to start editing.
								</p>
							</div>
						) : (
							lessons.map((lesson, index) => {
								const isActive = lesson.fields?.slug === currentLessonSlug
								return (
									<SidebarMenuItem key={lesson.id}>
										<SidebarMenuButton
											onClick={() =>
												handleLessonClick(lesson.fields?.slug || '')
											}
											className={cn(
												'h-auto w-full justify-start gap-3 p-3',
												isActive &&
													'bg-accent text-accent-foreground font-medium',
											)}
										>
											<div
												className={cn(
													'bg-muted flex h-6 w-6 items-center justify-center rounded text-xs font-medium',
													isActive && 'bg-background text-foreground',
												)}
											>
												{index + 1}
											</div>
											<div className="min-w-0 flex-1 text-left">
												<div className="truncate text-sm font-medium">
													{lesson.fields?.title}
												</div>
												<div className="mt-1 flex items-center gap-2">
													<span
														className={cn(
															'rounded px-1.5 py-0.5 text-xs',
															lesson.fields?.state === 'published'
																? 'bg-green-100 text-green-700'
																: 'bg-yellow-100 text-yellow-700',
														)}
													>
														{lesson.fields?.state === 'published'
															? 'Published'
															: 'Draft'}
													</span>
												</div>
											</div>
											{isActive && (
												<Edit className="text-muted-foreground h-3 w-3" />
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<Separator />

			<div className="space-y-2 p-4">
				<Button
					variant="outline"
					size="sm"
					className="w-full justify-start gap-2"
					onClick={() => router.push(`/workshops/${courseSlug}`)}
				>
					<Eye className="h-4 w-4" />
					View Course
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="w-full justify-start gap-2"
					onClick={() => router.push(`/posts/${courseSlug}/edit`)}
				>
					<BookOpen className="h-4 w-4" />
					Edit Course Details
				</Button>
			</div>
		</SidebarContent>
	)
}
