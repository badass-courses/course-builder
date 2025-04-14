import * as React from 'react'
import { ZapIcon } from 'lucide-react'

import { Button } from '../primitives/button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../primitives/tooltip'
import { cn } from '../utils/cn'
import type { ResourceTool } from './edit-resources-tool-panel'

export function EditResourcesToolbar({
	tools,
	onToolChange,
}: {
	tools: ResourceTool[]
	onToolChange: (tool: ResourceTool | null) => void
}) {
	const [activeTool, setActiveTool] = React.useState<ResourceTool | null>(null)
	return (
		<div className="bg-muted h-12 w-full md:h-[var(--pane-layout-height)] md:w-12 md:border-l">
			<div className="flex flex-row gap-1 p-1 md:flex-col">
				<TooltipProvider delayDuration={0}>
					{tools.map((tool) => (
						<Tooltip key={tool.id}>
							<TooltipTrigger asChild>
								<Button
									variant="link"
									type="button"
									className={cn(
										`hover:bg-background/50 flex aspect-square items-center justify-center rounded-lg border p-0 transition`,
										{
											'border-border bg-background': activeTool?.id === tool.id,
											'border-transparent bg-transparent':
												activeTool?.id !== tool.id,
										},
									)}
									onClick={() => {
										if (tool.id === activeTool?.id) {
											setActiveTool(null)
											onToolChange(null)
										} else {
											setActiveTool(tool)
											onToolChange(tool)
										}
									}}
								>
									{tool.icon ? (
										tool.icon()
									) : (
										<ZapIcon
											strokeWidth={1.5}
											size={24}
											width={18}
											height={18}
										/>
									)}
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
