import * as React from 'react'
import { User } from '@auth/core/types'
import type { UseFormReturn } from 'react-hook-form'

import type { ContentResource } from '@coursebuilder/core/schemas'

import { CodemirrorEditor } from '../../codemirror/editor'
import { ReactCodemirror } from '../../codemirror/editor-react'
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
	theme?: 'light' | 'dark'
	partykitUrl: string
	user?: User | null
}) {
	const onChange = React.useCallback((value: string) => {
		form.setValue('fields.body', value)
	}, [])
	return (
		<ResizablePanel
			defaultSize={50}
			className="min-h-[var(--pane-layout-height)] md:min-h-full"
		>
			<ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
				<ReactCodemirror
					onChange={onChange}
					value={resource.fields.body || ''}
					theme={theme}
				/>
			</ScrollArea>
		</ResizablePanel>
	)
}
