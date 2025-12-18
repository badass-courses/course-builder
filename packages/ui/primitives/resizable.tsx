'use client'

import * as React from 'react'
import { GripVertical } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '../utils/cn'

const ResizablePanelGroup: React.FC<
	React.PropsWithChildren<{
		direction: 'vertical' | 'horizontal'
		className?: string
		autoSaveId?: string
		id?: string
	}>
> = ({ className, autoSaveId, id, ...props }) => (
	<ResizablePrimitive.PanelGroup
		className={cn(
			'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
			className,
		)}
		autoSaveId={autoSaveId}
		id={id}
		{...props}
	/>
)

const ResizablePanel: React.FC<ResizablePrimitive.PanelProps> = (props) => (
	<ResizablePrimitive.Panel {...props} />
)

const ResizableHandle: React.FC<any & { withHandle?: boolean }> = ({
	withHandle,
	className,
	...props
}) => (
	<ResizablePrimitive.PanelResizeHandle
		className={cn(
			'bg-border focus-visible:ring-ring focus-visible:outline-hidden relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
