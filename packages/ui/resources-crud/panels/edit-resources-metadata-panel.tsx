import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { useIsSmallScreen } from '../../hooks/use-is-small-screen'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '../../primitives/accordion'
import { Form } from '../../primitives/form'
import { ResizablePanel } from '../../primitives/resizable'
import { ScrollArea } from '../../primitives/scroll-area'

export function EditResourcesMetadataPanel({
	form,
	children,
	onSubmit,
}: {
	form: UseFormReturn<any>
	children: React.ReactNode
	onSubmit: (values: any) => Promise<void>
}) {
	const isSmallScreen = useIsSmallScreen()

	return (
		<Form {...form}>
			<form
				className="min-h-[280px] min-w-[280px]"
				onSubmit={form.handleSubmit(onSubmit, (error) => {
					console.log({ error })
				})}
			>
				<ScrollArea className="md:h-(--pane-layout-height)">
					<div className="flex flex-col gap-5 py-5">{children}</div>
				</ScrollArea>
			</form>
		</Form>
	)
}
