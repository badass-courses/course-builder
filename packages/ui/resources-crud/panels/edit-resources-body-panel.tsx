import * as React from 'react'
import { User } from '@auth/core/types'
import { EditorView } from '@codemirror/view'
import MarkdownEditor, { ICommand } from '@uiw/react-markdown-editor'
import { EyeIcon } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { yCollab } from 'y-codemirror.jh'
import YPartyKitProvider from 'y-partykit/provider'
import useYProvider from 'y-partykit/react'
import * as Y from 'yjs'

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
	mdxPreviewComponent,
	onResourceBodyChange,
	toggleMdxPreview,
	isShowingMdxPreview = false,
}: {
	resource: {
		id: string
		fields: {
			yDoc?: string | null
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
	mdxPreviewComponent?: React.ReactNode
	onResourceBodyChange?: (value: string) => void
	toggleMdxPreview?: () => void
	isShowingMdxPreview?: boolean
}) {
	const onChange = React.useCallback((value: string, yDoc?: any) => {
		if (yDoc) {
			form.setValue('fields.yDoc', yDoc)
		}
		form.setValue('fields.body', value)
		onResourceBodyChange && onResourceBodyChange(value)
	}, [])

	const partyKitProvider = useYProvider({
		host: partykitUrl,
		room: resource.id,
	})

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
			if (!mdxPreviewComponent) return
			if (!state || !view) return
			toggleMdxPreview && toggleMdxPreview()
		},
	}

	const withMdxPreview = Boolean(mdxPreviewComponent)

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

	const ytext =
		partyKitProvider.doc.getText('codemirror') ||
		new Y.Doc().getText('codemirror')

	return (
		<>
			{isShowingMdxPreview && (
				<>
					<ResizablePanel
						id="edit-resources-body-preview-panel"
						order={2}
						defaultSize={20}
					>
						{mdxPreviewComponent}
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
					{children}
					{hasMounted && (
						<MarkdownEditor
							previewProps={{
								components: {
									// @ts-expect-error
									scrollycoding: ({ children }: any) => children,
									testimonial: ({ children }: any) => children,
									instructor: ({ children }: any) => children,
								},
							}}
							height="var(--code-editor-layout-height)"
							value={resource.fields.body || ''}
							onChange={(value, viewUpdate) => {
								const yDoc = Buffer.from(
									Y.encodeStateAsUpdate(partyKitProvider.doc),
								).toString('base64')
								onChange(value, yDoc)
							}}
							enablePreview={withMdxPreview ? false : true}
							theme={
								(theme === 'dark'
									? CourseBuilderEditorThemeDark
									: CourseBuilderEditorThemeLight) ||
								CourseBuilderEditorThemeDark
							}
							extensions={[
								EditorView.lineWrapping,
								// ...(partyKitProvider
								// 	? [yCollab(ytext, partyKitProvider.awareness)]
								// 	: []),
							]}
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
