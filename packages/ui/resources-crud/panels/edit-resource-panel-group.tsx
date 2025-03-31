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
			className="!flex-col border-t md:!flex-row"
			autoSaveId="edit-layout-panel-group"
		>
			{children}
		</ResizablePanelGroup>
	)
}
