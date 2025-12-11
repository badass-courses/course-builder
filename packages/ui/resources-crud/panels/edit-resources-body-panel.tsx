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
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)

	const onChange = React.useCallback((value: string, yDoc?: any) => {
		if (yDoc) {
			form.setValue('fields.yDoc', yDoc)
		}
		form.setValue('fields.body', value)
		onResourceBodyChange && onResourceBodyChange(value)
	}, [])

	const handleDrop = React.useCallback(
		(e: React.DragEvent<HTMLTextAreaElement>) => {
			e.preventDefault()
			const droppedText = e.dataTransfer.getData('text/plain')
			if (!droppedText) return

			const textarea = textareaRef.current
			if (!textarea) return

			// Get the current value from the textarea itself, not the form
			const currentValue = textarea.value || ''
			const cursorPosition = textarea.selectionStart
			const newValue =
				currentValue.slice(0, cursorPosition) +
				'\n' +
				droppedText +
				'\n' +
				currentValue.slice(cursorPosition)

			// Update the textarea directly
			textarea.value = newValue

			// Update the form state
			form.setValue('fields.body', newValue)
			onResourceBodyChange?.(newValue)

			// Set cursor position after the inserted text
			setTimeout(() => {
				textarea.focus()
				const newCursorPosition = cursorPosition + droppedText.length + 2
				textarea.setSelectionRange(newCursorPosition, newCursorPosition)
			}, 0)
		},
		[form, onResourceBodyChange],
	)

	const handleDragOver = React.useCallback(
		(e: React.DragEvent<HTMLTextAreaElement>) => {
			e.preventDefault()
		},
		[],
	)

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
				ref={textareaRef}
				defaultValue={form.getValues('fields.body') ?? ''}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
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
