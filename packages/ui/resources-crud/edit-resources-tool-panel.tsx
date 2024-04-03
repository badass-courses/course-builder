import * as React from 'react'
import { User } from '@auth/core/types'
import { ImagePlusIcon, ZapIcon } from 'lucide-react'

import { ContentResource } from '@coursebuilder/core/types'

import { ResizablePanel } from '../primitives/resizable'
import { cn } from '../utils/cn'
import { EditResourcesToolPanelContents } from './edit-resources-tool-panel-contents'
import { EditResourcesToolbar } from './edit-resources-toolbar'

export type ResourceTool = {
	id: string
	icon: () => React.JSX.Element
	label?: string
	tooltip?: string
	description?: string
	toolComponent?: React.ReactNode
}

const WIDGETS = new Set([
	{
		id: 'assistant',
		icon: () => <ZapIcon strokeWidth={1.5} size={24} width={18} height={18} />,
	},
	{
		id: 'media',
		icon: () => (
			<ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
		),
	},
])

export function EditResourcesToolPanel({
	resource,
	className,
	minSize = 15,
	maxSize = 50,
	defaultSize = 25,
	availableWorkflows,
	sendResourceChatMessage,
	hostUrl,
	user,
	tools = [],
}: {
	minSize?: number
	defaultSize?: number
	maxSize?: number
	className?: string
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
	const [activeToolId, setActiveToolId] = React.useState<string>(
		WIDGETS.values().next().value.id,
	)
	return (
		<>
			<ResizablePanel
				className={cn(
					'h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:min-h-full',
					className,
				)}
				minSize={minSize}
				defaultSize={defaultSize}
				maxSize={maxSize}
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
			<EditResourcesToolbar
				tools={WIDGETS}
				onToolChange={(tool) => setActiveToolId(tool.id)}
			/>
		</>
	)
}
