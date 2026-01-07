import * as React from 'react'

import { ResizablePanelGroup } from '../../primitives/resizable'

export function EditResourcePanelGroup({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="border-t"
			autoSaveId="edit-layout-panel-group"
			id="edit-layout-panel-group"
		>
			{children}
		</ResizablePanelGroup>
	)
}
