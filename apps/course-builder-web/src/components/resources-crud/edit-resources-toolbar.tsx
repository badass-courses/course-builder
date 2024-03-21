import * as React from 'react'
import { cn } from '@/utils/cn'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@coursebuilder/ui'

type ResourceTool = {
	id: string
	icon: () => React.JSX.Element
}

export function EditResourcesToolbar({
	tools,
	onToolChange,
}: {
	tools: Set<ResourceTool>
	onToolChange: (tool: ResourceTool) => void
}) {
	const [activeTool, setActiveTool] = React.useState<ResourceTool>(
		tools.values().next().value,
	)
	return (
		<div className="bg-muted h-12 w-full md:h-[var(--pane-layout-height)] md:w-12 md:border-l">
			<div className="flex flex-row gap-1 p-1 md:flex-col">
				<TooltipProvider delayDuration={0}>
					{Array.from(tools).map((tool) => (
						<Tooltip key={tool.id}>
							<TooltipTrigger asChild>
								<Button
									variant="link"
									type="button"
									className={cn(
										`hover:bg-background/50 flex aspect-square items-center justify-center rounded-lg border p-0 transition`,
										{
											'border-border bg-background': activeTool.id === tool.id,
											'border-transparent bg-transparent':
												activeTool.id !== tool.id,
										},
									)}
									onClick={() => {
										setActiveTool(tool)
										onToolChange(tool)
									}}
								>
									{tool.icon()}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left" className="capitalize">
								{tool.id}
							</TooltipContent>
						</Tooltip>
					))}
				</TooltipProvider>
			</div>
		</div>
	)
}
