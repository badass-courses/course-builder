import React from 'react'
import ModuleResourceList from '@/app/(content)/_components/navigation/module-resource-list'
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
			<div className="relative flex">
				<ModuleResourceList
					currentLessonSlug={params.lesson}
					className="bg-card sticky top-0 hidden h-screen max-w-xs border-b border-r lg:block"
				/>
				<LayoutClient withNavContainer={false} withFooterContainer={false}>
					<div className="flex min-w-0 items-start">
						<Sheet>
							<SheetTrigger className="bg-card/90 border-foreground/10 fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded border px-3 py-2 shadow-lg backdrop-blur-md lg:hidden dark:bg-gray-800/80">
								<MenuIcon className="size-4" /> Lessons
							</SheetTrigger>
							<SheetContent className="px-0 pt-0">
								<SheetHeader>
									<SheetTitle className="sr-only">Workshop Contents</SheetTitle>
								</SheetHeader>
								<ModuleResourceList
									options={{ isCollapsible: false }}
									currentLessonSlug={params.lesson}
									className="max-w-full border-r-0 border-t-0"
								/>
							</SheetContent>
						</Sheet>
						<div className="min-w-0 flex-1">{children}</div>
					</div>
				</LayoutClient>
			</div>
		</ActiveHeadingProvider>
	)
}

export default LessonLayout
