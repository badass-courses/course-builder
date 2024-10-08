import * as React from 'react'
import { User } from '@auth/core/types'
import { EditorView } from '@codemirror/view'
import MarkdownEditor from '@uiw/react-markdown-editor'
import type { UseFormReturn } from 'react-hook-form'

import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '../../codemirror/editor'
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
	const onChange = React.useCallback((value: string) => {
		form.setValue('fields.body', value)
	}, [])
	return (
		<ResizablePanel
			defaultSize={50}
			className="min-h-[var(--pane-layout-height)] md:min-h-full"
		>
			<ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
				<MarkdownEditor
					height="var(--code-editor-layout-height)"
					value={resource.fields.body || ''}
					onChange={onChange}
					theme={
						theme === 'dark'
							? CourseBuilderEditorThemeDark
							: CourseBuilderEditorThemeLight
					}
					extensions={[EditorView.lineWrapping]}
					basicSetup={{
						syntaxHighlighting: true,
					}}
				/>
			</ScrollArea>
		</ResizablePanel>
	)
}
