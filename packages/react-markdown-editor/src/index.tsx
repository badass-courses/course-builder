import React, {
	Fragment,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, type ViewUpdate } from '@codemirror/view'
import * as events from '@uiw/codemirror-extensions-events'
import CodeMirror, {
	type ReactCodeMirrorProps,
	type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import MarkdownPreview, {
	MarkdownPreviewProps,
} from '@uiw/react-markdown-preview'
import { yCollab } from 'y-codemirror.jh'
import useYProvider from 'y-partykit/react'
import * as Y from 'yjs'

import { getCommands, getModeCommands } from './commands'
import ToolBar, { type Commands } from './components/ToolBar'
import { defaultTheme } from './theme'

import './index.less'

export * from './theme'
export * from './commands'
export * from '@uiw/react-markdown-preview'

export const scrollerStyle = EditorView.theme({
	'&.cm-editor, & .cm-scroller': {
		borderBottomRightRadius: '3px',
		borderBottomLeftRadius: '3px',
	},
})

export interface IMarkdownEditor extends ReactCodeMirrorProps {
	className?: string
	prefixCls?: string
	/** The raw markdown that will be converted to html (**required**) */
	value?: string
	/** Shows a preview that will be converted to html. */
	visible?: boolean
	visibleEditor?: boolean
	/** Override the default preview component */
	renderPreview?: (
		props: MarkdownPreviewProps,
		initVisible: boolean,
	) => React.ReactNode
	/** Preview expanded width @default `50%` */
	previewWidth?: string
	/** Whether to enable preview function @default `true` */
	enablePreview?: boolean
	/** Whether to enable scrolling */
	enableScroll?: boolean
	/** Tool display settings. */
	toolbars?: Commands[]
	/** The tool on the right shows the settings. */
	toolbarsMode?: Commands[]
	/** Tool display filter settings. */
	toolbarsFilter?: (tool: Commands, idx: number) => boolean
	/** Toolbar on bottom */
	toolbarBottom?: boolean
	/** Option to hide the tool bar. @deprecated The next major version will be deprecated. Please use `showToolbar`. */
	hideToolbar?: boolean
	/** Option to hide the tool bar. */
	showToolbar?: boolean
	/** [@uiw/react-markdown-preview](https://github.com/uiwjs/react-markdown-preview#options-props) options */
	previewProps?: MarkdownPreviewProps
	/** replace the default `extensions` */
	reExtensions?: ReactCodeMirrorProps['extensions']
	/** Edit mode and preview mode switching event */
	onPreviewMode?: (isHide: boolean) => void
	partyKit?: {
		host: string
		room: string
	}
	onYdocChange: (value: string, yDoc: string) => void
}

export interface ToolBarProps {
	prefixCls?: string
	editor: React.RefObject<ReactCodeMirrorRef | null>
	preview: React.RefObject<HTMLDivElement | null>
	container: React.RefObject<HTMLDivElement | null>
	containerEditor: React.RefObject<HTMLDivElement | null>
	editorProps: IMarkdownEditor
}

export interface MarkdownEditorRef {
	editor: React.RefObject<ReactCodeMirrorRef | null>
	preview: React.RefObject<HTMLDivElement | null>
}

type MarkdownEditorComponent = React.ForwardRefExoticComponent<
	React.PropsWithRef<IMarkdownEditor> & React.RefAttributes<MarkdownEditorRef>
> & {
	Markdown: typeof MarkdownPreview
}

const MarkdownEditor = React.forwardRef<MarkdownEditorRef, IMarkdownEditor>(
	MarkdownEditorInternal,
) as MarkdownEditorComponent

MarkdownEditor.Markdown = MarkdownPreview

export default MarkdownEditor

function MarkdownEditorInternal(
	props: IMarkdownEditor,
	ref: React.ForwardedRef<MarkdownEditorRef>,
) {
	const {
		prefixCls = 'md-editor',
		className,
		onChange,
		toolbars = getCommands(),
		toolbarsMode = getModeCommands(),
		toolbarsFilter,
		visible = true,
		renderPreview,
		visibleEditor = true,
		hideToolbar,
		showToolbar = true,
		toolbarBottom = false,
		enableScroll = true,
		enablePreview = true,
		previewProps = {},
		extensions = [],
		previewWidth = '50%',
		reExtensions,
		onPreviewMode,
		partyKit,
		onYdocChange,
		...codemirrorProps
	} = props
	const [value, setValue] = useState(props.value || '')
	const codeMirror = useRef<ReactCodeMirrorRef>(null)
	const container = useRef<HTMLDivElement>(null)
	const containerEditor = useRef<HTMLDivElement>(null)
	const preview = useRef<HTMLDivElement>(null)
	const active = useRef<'editor' | 'preview'>('editor')

	const partyKitProvider = useYProvider({
		host: partyKit?.host || '',
		room: partyKit?.room || '',
	})

	useImperativeHandle(
		ref,
		() => ({
			editor: codeMirror,
			preview: preview,
		}),
		[codeMirror],
	)

	const toolBarProps: ToolBarProps = {
		prefixCls,
		preview: preview,
		editor: codeMirror,
		container: container,
		containerEditor: containerEditor,
		editorProps: { ...props, previewWidth },
	}
	const height =
		typeof codemirrorProps.height === 'number'
			? `${codemirrorProps.height}px`
			: codemirrorProps.height

	const preValue = props.value
	useEffect(() => setValue(preValue ?? ''), [preValue])

	const previewScrollHandle = useCallback(
		(event: Event) => {
			if (!enableScroll) return
			const target = event.target as HTMLDivElement
			const percent = target.scrollTop / target.scrollHeight
			if (active.current === 'editor' && preview.current) {
				const previewHeihgt = preview.current?.scrollHeight || 0
				preview.current!.scrollTop = previewHeihgt * percent
			} else if (codeMirror.current && codeMirror.current.view) {
				const editorScrollDom = codeMirror.current.view.scrollDOM
				const editorScrollHeihgt =
					codeMirror.current.view.scrollDOM.scrollHeight || 0
				editorScrollDom.scrollTop = editorScrollHeihgt * percent
			}
		},
		[enableScroll],
	)
	const mouseoverHandle = () => (active.current = 'preview')
	const mouseleaveHandle = () => (active.current = 'editor')
	useEffect(() => {
		const $preview = preview.current
		if ($preview && enableScroll) {
			$preview.addEventListener('mouseover', mouseoverHandle, false)
			$preview.addEventListener('mouseleave', mouseleaveHandle, false)
			$preview.addEventListener('scroll', previewScrollHandle, false)
		}
		return () => {
			if ($preview && enableScroll) {
				$preview.removeEventListener('mouseover', mouseoverHandle)
				$preview.removeEventListener('mouseleave', mouseoverHandle)
				$preview.addEventListener('mouseleave', previewScrollHandle, false)
			}
		}
	}, [preview, enableScroll, previewScrollHandle])

	const scrollExtensions = events.scroll({
		scroll: previewScrollHandle,
	})

	const ytext =
		partyKitProvider.doc.getText('codemirror') ||
		new Y.Doc().getText('codemirror')

	let extensionsData: IMarkdownEditor['extensions'] = reExtensions
		? reExtensions
		: [
				markdown({ base: markdownLanguage, codeLanguages: languages }),
				scrollerStyle,
				...(partyKitProvider
					? [yCollab(ytext, partyKitProvider.awareness)]
					: []),
				...extensions,
			]
	if (enableScroll) {
		extensionsData.push(scrollExtensions)
	}
	const clsPreview = `${prefixCls}-preview`
	const cls = [prefixCls, 'wmde-markdown-var', className]
		.filter(Boolean)
		.join(' ')
	previewProps['source'] = value
	const handleChange = (value: string, viewUpdate: ViewUpdate) => {
		const yDoc = Buffer.from(
			Y.encodeStateAsUpdate(partyKitProvider.doc),
		).toString('base64')
		setValue(value)
		onChange && onChange(value, viewUpdate)
		onYdocChange && onYdocChange(value, yDoc)
	}
	const conentView = (
		<div
			className={`${prefixCls}-content`}
			style={{ height: codemirrorProps.height }}
		>
			<div className={`${prefixCls}-content-editor`} ref={containerEditor}>
				{visibleEditor && (
					<CodeMirror
						theme={defaultTheme}
						{...codemirrorProps}
						className={`${prefixCls}-inner`}
						extensions={extensionsData}
						height={height}
						ref={codeMirror}
						onChange={handleChange}
					/>
				)}
			</div>
			{enablePreview && (
				<div className={clsPreview} ref={preview}>
					{renderPreview ? (
						renderPreview(previewProps, !!visible)
					) : (
						<MarkdownPreview {...previewProps} data-visible={!!visible} />
					)}
				</div>
			)}
		</div>
	)

	const clsToolbar = [
		prefixCls && `${prefixCls}-toolbar-warp`,
		prefixCls && toolbarBottom && `${prefixCls}-toolbar-bottom`,
	]
		.filter(Boolean)
		.join(' ')

	const tools = toolbarsFilter ? toolbars.filter(toolbarsFilter) : toolbars
	const toolsMode = toolbarsFilter
		? toolbarsMode.filter(toolbarsFilter)
		: toolbarsMode
	const isShowToolbar = hideToolbar ?? showToolbar
	const toolbarView = isShowToolbar && (
		<div className={clsToolbar}>
			<ToolBar {...toolBarProps} toolbars={tools} />
			<ToolBar {...toolBarProps} toolbars={toolsMode} mode />
		</div>
	)
	const child = toolbarBottom ? (
		<Fragment>
			{conentView}
			{toolbarView}
		</Fragment>
	) : (
		<Fragment>
			{toolbarView}
			{conentView}
		</Fragment>
	)
	return (
		<div className={cls} ref={container}>
			{child}
		</div>
	)
}
