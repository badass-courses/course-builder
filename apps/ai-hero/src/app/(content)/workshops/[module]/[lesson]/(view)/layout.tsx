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
} from '@coursebuilder/ui'

const LessonLayout = async (props: {
	params: Promise<{ module: string; lesson: string }>
	children: React.ReactNode
}) => {
	const params = await props.params

	const { children } = props

	return (
		<ActiveHeadingProvider>
			<LayoutClient withContainer>
				<div className="flex min-w-0">
					<WorkshopResourceList
						currentLessonSlug={params.lesson}
						className="hidden lg:block"
					/>
					<Sheet>
						<SheetTrigger className="bg-card/80 fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded border p-3 backdrop-blur-md lg:hidden">
							<MenuIcon className="size-4" /> Lessons
						</SheetTrigger>
						<SheetContent className="px-0 pt-0">
							<SheetHeader>
								<SheetTitle className="sr-only">Workshop Contents</SheetTitle>
							</SheetHeader>
							<WorkshopResourceList
								isCollapsible={false}
								currentLessonSlug={params.lesson}
								className="max-w-full border-r-0 border-t-0"
							/>
						</SheetContent>
					</Sheet>
					<div className="min-w-0 flex-1">{children}</div>
				</div>
			</LayoutClient>
		</ActiveHeadingProvider>
	)
}

export default LessonLayout
