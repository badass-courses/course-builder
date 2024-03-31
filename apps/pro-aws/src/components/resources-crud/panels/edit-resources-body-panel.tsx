import * as React from 'react'
import { CodemirrorEditor } from '@/components/codemirror'
import type { UseFormReturn } from 'react-hook-form'

import { ContentResource } from '@coursebuilder/core/types'
import { ResizablePanel, ScrollArea } from '@coursebuilder/ui'

export function EditResourcesBodyPanel({
	resource,
	form,
}: {
	resource: ContentResource & {
		fields: {
			body?: string | null
			title?: string | null
			slug: string
		}
	}
	form: UseFormReturn<any>
}) {
	return (
		<ResizablePanel
			defaultSize={50}
			className="min-h-[var(--pane-layout-height)] md:min-h-full"
		>
			<ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
				<CodemirrorEditor
					roomName={`${resource.id}`}
					value={resource.fields.body || ''}
					onChange={async (data) => {
						form.setValue('fields.body', data)
					}}
				/>
			</ScrollArea>
		</ResizablePanel>
	)
}
