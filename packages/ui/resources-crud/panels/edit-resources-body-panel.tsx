import * as React from 'react'
import { User } from '@auth/core/types'
import type { UseFormReturn } from 'react-hook-form'

import { ContentResource } from '@coursebuilder/core/types'

import { CodemirrorEditor } from '../../codemirror/editor'
import { ResizablePanel } from '../../primitives/resizable'
import { ScrollArea } from '../../primitives/scroll-area'

export function EditResourcesBodyPanel({
	resource,
	form,
	theme = 'light',
	partykitUrl,
	user,
}: {
	resource: {
		id: string
		fields: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	form: UseFormReturn<any>
	theme?: string
	partykitUrl: string
	user?: User | null
}) {
	return (
		<ResizablePanel
			defaultSize={50}
			className="min-h-[var(--pane-layout-height)] md:min-h-full"
		>
			<ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
				<CodemirrorEditor
					partykitUrl={partykitUrl}
					roomName={`${resource.id}`}
					value={resource.fields.body || ''}
					onChange={async (data, yDoc) => {
						form.setValue('fields.yDoc', yDoc)
						form.setValue('fields.body', data)
					}}
					theme={theme}
					user={user}
				/>
			</ScrollArea>
		</ResizablePanel>
	)
}
