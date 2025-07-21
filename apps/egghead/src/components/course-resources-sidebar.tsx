'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { BookOpen, FileText, Plus } from 'lucide-react'

interface CourseResourcesSidebarProps {
	course: Post
	resources: any[]
	currentResourceSlug?: string
	courseSlug: string
}

export function CourseResourcesSidebar({
	course,
	resources,
	currentResourceSlug,
	courseSlug,
}: CourseResourcesSidebarProps) {
	const router = useRouter()
	const searchParams = useSearchParams()

	const handleResourceClick = (resourceSlug: string) => {
		// Navigate to the course edit page with the resource as a query param
		const params = new URLSearchParams(searchParams)
		params.set('resource', resourceSlug)
		router.push(`/posts/${courseSlug}/edit?${params.toString()}`)
	}

	const handleCourseClick = () => {
		// Navigate back to editing just the course
		router.push(`/posts/${courseSlug}/edit`)
	}

	// Extract lessons from resources
	const lessons = resources.filter((resource) => {
		const fields = resource.fields as any
		return fields?.postType === 'lesson'
	})

	return (
		<SidebarContent>
			<SidebarHeader className="border-b pb-4">
				<div>
					<h2 className="mb-2 text-sm font-semibold">Course Resources</h2>
					<Button
						variant={!currentResourceSlug ? 'secondary' : 'ghost'}
						size="sm"
						className="w-full justify-start gap-2"
						onClick={handleCourseClick}
					>
						<BookOpen className="h-4 w-4" />
						<span className="truncate">{course.fields?.title}</span>
					</Button>
				</div>
			</SidebarHeader>

			<SidebarGroup>
				<SidebarGroupLabel>
					<div className="flex w-full items-center justify-between">
						<span>Lessons</span>
						<span className="text-muted-foreground text-xs">
							{lessons.length}
						</span>
					</div>
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{lessons.length === 0 ? (
							<div className="px-2 py-4 text-center">
								<p className="text-muted-foreground mb-2 text-xs">
									No lessons yet.
								</p>
								<Button variant="outline" size="sm" className="w-full">
									<Plus className="mr-1 h-3 w-3" />
									Add Lesson
								</Button>
							</div>
						) : (
							lessons.map((lesson, index) => {
								const lessonSlug = lesson.fields?.slug
								const isActive = lessonSlug === currentResourceSlug
								return (
									<SidebarMenuItem key={lesson.id}>
										<SidebarMenuButton
											onClick={() => handleResourceClick(lessonSlug || '')}
											className={cn(
												'h-auto w-full justify-start gap-3 p-3',
												isActive &&
													'bg-accent text-accent-foreground font-medium',
											)}
										>
											<div
												className={cn(
													'bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium',
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
												<FileText className="text-muted-foreground h-3 w-3 shrink-0" />
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	)
}
