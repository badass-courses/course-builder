'use client'

import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import type { Workshop } from '@/lib/workshops'
import { Check } from 'lucide-react'

import { AccordionTrigger } from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export default function WorkshopItemSidebar({
	workshop,
	index,
}: {
	workshop: Workshop
	index: number
}) {
	const { moduleProgress } = useModuleProgress()
	const isWorkshopCompleted =
		moduleProgress?.percentCompleted && moduleProgress?.percentCompleted >= 100

	return (
		<div className="relative flex items-stretch justify-between">
			<Link
				className="text-foreground/90 hover:text-primary hover:bg-muted/50 flex w-full items-center justify-between py-2.5 pl-3 pr-10 text-base font-semibold transition ease-in-out"
				href={getResourcePath('workshop', workshop.fields.slug, 'view')}
			>
				<div className="flex items-center">
					{isWorkshopCompleted ? (
						<Check className="text-primary mr-2 size-3 shrink-0" />
					) : (
						<span className="text-muted-foreground mr-2 flex size-3 shrink-0 items-center justify-center text-[10px] font-normal opacity-75">
							{index}
						</span>
					)}
					{workshop.fields.title.includes(':')
						? workshop.fields.title.split(':')[1]
						: workshop.fields.title}
				</div>
			</Link>
			<AccordionTrigger
				aria-label="Toggle lessons"
				className="hover:bg-muted [&_svg]:hover:text-primary flex aspect-square h-full w-11 shrink-0 items-center justify-center rounded-none border-l bg-transparent"
			/>
		</div>
	)
}
