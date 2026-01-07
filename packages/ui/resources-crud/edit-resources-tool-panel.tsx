import * as React from 'react'
import { User } from '@auth/core/types'
import { ImagePlusIcon, ZapIcon } from 'lucide-react'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { ResizableHandle, ResizablePanel } from '../primitives/resizable'
import { cn } from '../utils/cn'
import { EditResourcesToolPanelContents } from './edit-resources-tool-panel-contents'
import { EditResourcesToolbar } from './edit-resources-toolbar'

export type ResourceTool = {
	id: string
	icon?: () => React.JSX.Element
	label?: string
	tooltip?: string
	description?: string
	toolComponent?: React.ReactNode
}

export function EditResourcesToolPanel({
	resource,

	availableWorkflows,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
}: {
	resource: ContentResource & {
		fields: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	availableWorkflows?: { value: string; label: string; default?: boolean }[]
	sendResourceChatMessage: (options: {
		resourceId: string
		messages: any[]
		selectedWorkflow?: string
	}) => Promise<void>
	hostUrl: string
	user?: User | null
	tools?: ResourceTool[]
}) {
	const [activeToolId, setActiveToolId] = React.useState<string | null>(null)
	return (
		<>
			{activeToolId !== null && (
				<>
					<ResizableHandle />
					<ResizablePanel
						id="edit-resources-tool-panel"
						order={4}
						className={
							'h-(--pane-layout-height) min-h-(--pane-layout-height) md:min-h-full'
						}
						minSize={15}
						defaultSize={25}
						// maxSize={25}
					>
						<EditResourcesToolPanelContents
							resource={resource}
							activeToolId={activeToolId}
							availableWorkflows={availableWorkflows}
							sendResourceChatMessage={sendResourceChatMessage}
							hostUrl={hostUrl}
							user={user}
							tools={tools}
						/>
					</ResizablePanel>
				</>
			)}
			<EditResourcesToolbar
				tools={tools}
				onToolChange={(tool) => {
					if (activeToolId === tool?.id) {
						setActiveToolId(null)
						return
					}

					setActiveToolId(tool?.id ?? null)
				}}
			/>
		</>
	)
}
