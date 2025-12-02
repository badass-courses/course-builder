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
import { Textarea } from '../../primitives/textarea'
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

	// const partyKitProvider = useYProvider({
	// 	host: partykitUrl,
	// 	room: resource.id,
	// })

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

	// const ytext =
	// 	partyKitProvider.doc.getText('codemirror') ||
	// 	new Y.Doc().getText('codemirror')

	return (
		<>
			{children}
			<Textarea
				{...form.register('fields.body')}
				defaultValue={form.getValues('fields.body') ?? ''}
				className="h-[calc(100vh-var(--nav-height)-var(--command-bar-height))] rounded-none border-none p-5 text-base"
			/>
			{/* {hasMounted && (
				<MarkdownEditor
					previewProps={{
						components: {
							// @ts-expect-error
							scrollycoding: ({ children }: any) => children,
							testimonial: ({ children }: any) => children,
							instructor: ({ children }: any) => children,
						},
					}}
					height={children ? '100%' : 'var(--code-editor-layout-height)'}
					value={form.getValues('fields.body') || ''}
					onChange={(value, viewUpdate) => {
						const yDoc = Buffer.from(
							Y.encodeStateAsUpdate(partyKitProvider.doc),
						).toString('base64')
						onChange(value, yDoc)
					}}
					enablePreview={withMdxPreview ? false : true}
					theme={
						theme === 'dark'
							? CourseBuilderEditorThemeDark
							: CourseBuilderEditorThemeLight
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
			)} */}
		</>
	)
}
