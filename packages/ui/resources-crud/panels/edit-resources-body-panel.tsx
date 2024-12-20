import * as React from 'react'
import { User } from '@auth/core/types'
import { EditorView } from '@codemirror/view'
import MarkdownEditor, { ICommand } from '@uiw/react-markdown-editor'
import { EyeIcon } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import {
	CourseBuilderEditorThemeDark,
	CourseBuilderEditorThemeLight,
} from '../../codemirror/editor'
import { ResizableHandle, ResizablePanel } from '../../primitives/resizable'
import { ScrollArea } from '../../primitives/scroll-area'
import { cn } from '../../utils/cn'

export function EditResourcesBodyPanel({
	resource,
	form,
	theme = 'light',
	partykitUrl,
	user,
	children,
	onResourceBodyChange,
	toggleMdxPreview,
	isShowingMdxPreview = false,
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
	children?: React.ReactNode
	onResourceBodyChange?: (value: string) => void
	toggleMdxPreview?: () => void
	isShowingMdxPreview?: boolean
}) {
	const onChange = React.useCallback((value: string) => {
		form.setValue('fields.body', value)
		onResourceBodyChange && onResourceBodyChange(value)
	}, [])

	const [hasMounted, setHasMounted] = React.useState(false)
	React.useEffect(() => {
		setHasMounted(true)
	}, [])

	const previewMdxButton: ICommand = {
		name: 'mdx-preview',
		keyCommand: 'cmd+shift+p',
		button: { 'aria-label': 'Trigger MDX Preview' },
		icon: (
			<EyeIcon
				size={16}
				className={cn('', {
					'text-primary': isShowingMdxPreview,
				})}
				strokeWidth={2}
			/>
		),
		execute: ({ state, view }) => {
			if (!children) return
			if (!state || !view) return
			toggleMdxPreview && toggleMdxPreview()
		},
	}

	const withMdxPreview = Boolean(children)

	const defaultCommands = [
		'undo',
		'redo',
		'bold',
		'italic',
		'header',
		'strike',
		'underline',
		'quote',
		'olist',
		'ulist',
		'todo',
		'link',
		'image',
		'code',
		'codeBlock',
	] as ICommand[]

	return (
		<>
			{isShowingMdxPreview && (
				<>
					<ResizablePanel
						id="edit-resources-body-preview-panel"
						order={2}
						defaultSize={20}
					>
						{children}
					</ResizablePanel>
					<ResizableHandle />
				</>
			)}
			<ResizablePanel
				id="edit-resources-body-panel"
				order={3}
				defaultSize={55}
				className="flex min-h-[var(--pane-layout-height)] md:min-h-full"
			>
				<ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
					{hasMounted && (
						<MarkdownEditor
							height="var(--code-editor-layout-height)"
							value={resource.fields.body || ''}
							onChange={onChange}
							enablePreview={withMdxPreview ? false : true}
							theme={
								(theme === 'dark'
									? CourseBuilderEditorThemeDark
									: CourseBuilderEditorThemeLight) ||
								CourseBuilderEditorThemeDark
							}
							extensions={[EditorView.lineWrapping]}
							toolbars={
								withMdxPreview
									? [previewMdxButton, ...defaultCommands]
									: [...defaultCommands]
							}
						/>
					)}
				</ScrollArea>
			</ResizablePanel>
		</>
	)
}
