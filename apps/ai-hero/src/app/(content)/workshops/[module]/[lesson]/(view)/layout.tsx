import React from 'react'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'
import LayoutClient from '@/components/layout-client'
import { ActiveHeadingProvider } from '@/hooks/use-active-heading'
import { MenuIcon } from 'lucide-react'

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Skeleton,
} from '@coursebuilder/ui'

const LessonLayout = async (props: {
	params: Promise<{ module: string; lesson: string }>
	children: React.ReactNode
}) => {
	const params = await props.params

	const { children } = props

	return (
		<ActiveHeadingProvider>
			<LayoutClient>
				<div className="flex">
					<React.Suspense
						fallback={
							<div className="flex w-full max-w-sm flex-shrink-0 flex-col gap-2 border-l p-5">
								<Skeleton className="mb-8 h-8 w-full bg-gray-800" />
								{new Array(10).fill(null).map((_, i) => (
									<Skeleton key={i} className="h-8 w-full bg-gray-800" />
								))}
							</div>
						}
					>
						<WorkshopResourceList
							currentLessonSlug={params.lesson}
							className="hidden lg:block"
						/>
						<Sheet>
							<SheetTrigger className="bg-card/80 fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded border p-3 backdrop-blur-md lg:hidden">
								<MenuIcon className="size-4" /> Lessons
							</SheetTrigger>
							<SheetContent className="px-0">
								<SheetHeader>
									<SheetTitle className="sr-only">Workshop Contents</SheetTitle>
								</SheetHeader>
								<WorkshopResourceList
									currentLessonSlug={params.lesson}
									className="border-r-0 border-t-0"
								/>
							</SheetContent>
						</Sheet>
					</React.Suspense>
					{children}
				</div>
			</LayoutClient>
		</ActiveHeadingProvider>
	)
}

export default LessonLayout
