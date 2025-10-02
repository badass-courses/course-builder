import { useCallback, useEffect, useState } from 'react'
import { User } from '@auth/core/types'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import {
	EditorState,
	Extension,
	Range,
	StateEffect,
	StateField,
} from '@codemirror/state'
import { Decoration } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'
import { basicSetup, EditorView } from 'codemirror'
import { yCollab } from 'y-codemirror.jh'
import YPartyKitProvider from 'y-partykit/provider'
import * as Y from 'yjs'

async function generateHash(message: string) {
	const encoder = new TextEncoder()
	const data = encoder.encode(message)
	const hash = await window.crypto.subtle.digest('SHA-256', data)
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

export const CodemirrorEditor = ({
	roomName,
	value,
	onChange,
	theme = 'light',
	partykitUrl,
	user,
}: {
	roomName: string
	value: string
	onChange: (data: any) => void
	user?: User | null
	theme?: string
	partykitUrl: string
}) => {
	const { codemirrorElementRef } = useCodemirror({
		roomName,
		value,
		onChange,
		theme,
		partykitUrl,
		user,
	})

	return <div className="h-full shrink-0" ref={codemirrorElementRef} />
}

const CourseBuilderEditorStyles = {
	'.cm-content, .cm-gutter': {
		minHeight: 'var(--pane-layout-height)',
		height: '100%',
	},
	'.cm-content': {
		padding: '2rem 0',
		fontSize: '15px',
		fontFamily: 'var(--font-sans)',
		color: 'hsl(var(--foreground))',
	},
	'.cm-line': {
		padding: '0 2rem',
	},
	'.cm-gutters': {
		backgroundColor: 'hsl(var(--background))',
		borderRight: 'none',
		opacity: 0.5,
	},
	'.cm-gutterElement': {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		lineHeight: 1,
	},
	'.cm-activeLineGutter': {},
	'.cm-lineNumbers': {
		fontSize: '12px',
	},
	'&.cm-focused': {
		outline: 'none',
	},
	'.cm-activeLine': {
		backgroundColor: 'hsl(var(--foreground) / 3%)',
	},
	'.cm-cursor': {
		borderLeft: '1px solid hsl(var(--foreground))',
	},
}

const styles: Extension[] = [
	EditorView.theme(CourseBuilderEditorStyles),
	EditorView.lineWrapping,
	EditorView.domEventHandlers({}),
]

/**
 * @see {@link https://codemirror.net/docs/ref/#codemirror.basicSetup Code Mirror Basic Setup}
 * @param options
 * @constructor
 */
const useCodemirror = ({
	roomName,
	value,
	onChange,
	partykitUrl,
	user,
	theme = 'dark',
}: {
	roomName: string
	value: string
	onChange: (data: any) => void
	partykitUrl?: string
	user?: User | null
	theme?: string
}) => {
	const [element, setElement] = useState<HTMLElement>()
	const [yUndoManager, setYUndoManager] = useState<Y.UndoManager>()
	const [currentText, setCurrentText] = useState<string>(value)

	let updateListenerExtension = EditorView.updateListener.of(async (update) => {
		if (update.docChanged) {
			const docText = update.state.doc.toString()
			const hash = await generateHash(docText)
			if (hash !== currentText) {
				onChange(docText)
				setCurrentText(hash)
			}
		}
	})

	useEffect(() => {
		let view: EditorView

		if (!element) {
			return
		}

		const ytext = new Y.Doc().getText('codemirror')

		const undoManager = new Y.UndoManager(ytext)
		setYUndoManager(undoManager)

		// Set up CodeMirror and extensions
		const state = EditorState.create({
			doc: value,
			extensions: [
				basicSetup,
				updateListenerExtension,
				theme === 'dark'
					? CourseBuilderEditorThemeDark
					: CourseBuilderEditorThemeLight,
				markdown({
					codeLanguages: languages,
				}),
				...styles,
			],
		})

		// Attach CodeMirror to element
		view = new EditorView({
			state,
			parent: element,
		})

		// Set up awareness

		return () => {
			// provider?.doc?.destroy()
			// provider?.destroy()
			view?.destroy()
		}
	}, [roomName, value, user, theme])

	return {
		codemirrorElementRef: useCallback((node: HTMLElement | null) => {
			if (!node) return
			setElement(node)
		}, []),
	}
}

export const CourseBuilderEditorThemeLight = createTheme({
	theme: 'light',
	settings: {
		fontFamily: 'var(--font-sans)',
		background: 'var(--md-editor-background)',
		backgroundImage: '',
		foreground: 'var(--md-editor-foreground)',
		caret: '#000',
		selection: 'hsla(0, 0%, 0%, 0.35)',
		selectionMatch: 'hsla(0, 0%, 0%, 0.35)',
		lineHighlight: 'hsla(0, 0%, 0%, 0.05)',
		gutterBorder: '1px solid var(--md-editor-border)',
		gutterBackground: 'var(--md-editor-background)',
		gutterForeground: 'hsla(0, 0%, 0%, 0.3)',
	},
	styles: [
		{ tag: t.heading1, class: 'cm-heading-1' },
		{ tag: t.link, color: '#0080ff' },
		{
			tag: [t.monospace, t.regexp, t.meta],
		},
		// github light
		{
			tag: [t.standard(t.tagName), t.tagName],
			color: '#116329',
			fontFamily: 'monospace',
		},
		{
			tag: [t.comment, t.bracket],
			color: '#6a737d',
			fontFamily: 'monospace',
		},
		{
			tag: [t.className, t.propertyName],
			color: '#6f42c1',
			fontFamily: 'monospace',
		},
		{
			tag: [t.variableName, t.attributeName, t.number, t.operator],
			color: '#005cc5',
			fontFamily: 'monospace',
		},
		{
			tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
			color: '#d73a49',
			fontFamily: 'monospace',
		},
		{
			tag: [t.string, t.meta, t.regexp],
			color: '#032f62',
			fontFamily: 'monospace',
		},
		{ tag: [t.name, t.quote], color: '#22863a', fontFamily: 'monospace' },
		{ tag: [t.heading, t.strong], color: '#24292e', fontWeight: 'bold' },
		{ tag: [t.emphasis], color: '#24292e', fontStyle: 'italic' },
		{
			tag: [t.deleted],
			color: '#b31d28',
			backgroundColor: 'ffeef0',
			fontFamily: 'monospace',
		},
		{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#e36209' },
		{ tag: [t.url, t.escape, t.regexp, t.link], color: '#0080ff' },
		{ tag: t.link, textDecoration: 'underline' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{ tag: t.invalid, color: '#cb2431', fontFamily: 'monospace' },
	],
})
export const CourseBuilderEditorThemeDark = createTheme({
	theme: 'dark',
	settings: {
		fontFamily: 'var(--font-sans)',
		background: 'var(--md-editor-background)',
		backgroundImage: '',
		foreground: 'var(--md-editor-foreground)',
		caret: '#fff',
		selection: 'hsla(0, 0%, 100%, 0.35)',
		selectionMatch: 'hsla(0, 0%, 100%, 0.35)',
		lineHighlight: 'hsla(0, 0%, 100%, 0.1)',
		gutterBorder: '1px solid var(--md-editor-border)',
		gutterBackground: 'var(--md-editor-background)',
		gutterForeground: 'hsla(0, 0%, 100%, 0.3)',
	},
	styles: [
		{
			tag: t.heading1,
			class: 'cm-heading-1',
		},
		{
			tag: t.link,
			color: '#0080ff',
		},
		// github dark
		{
			tag: [t.standard(t.tagName), t.tagName],
			color: '#7ee787',
			fontFamily: 'monospace',
		},
		{
			tag: [t.comment, t.bracket],
			color: '#8b949e',
			fontFamily: 'monospace',
		},
		{
			tag: [t.className, t.propertyName],
			color: '#d2a8ff',
			fontFamily: 'monospace',
		},
		{
			tag: [t.variableName, t.attributeName, t.number, t.operator],
			color: '#79c0ff',
			fontFamily: 'monospace',
		},
		{
			tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
			color: '#ff7b72',
			fontFamily: 'monospace',
		},
		{
			tag: [t.string, t.meta, t.regexp],
			color: '#a5d6ff',
			fontFamily: 'monospace',
		},
		{
			tag: [t.name, t.quote],
			color: '#7ee787',
			fontFamily: 'monospace',
		},
		{
			tag: [t.heading, t.strong],
			color: '#d2a8ff',
			fontWeight: 'bold',
		},
		{
			tag: [t.emphasis],
			color: '#d2a8ff',
			fontStyle: 'italic',
		},
		{
			tag: [t.deleted],
			color: '#ffdcd7',
			backgroundColor: 'ffeef0',
			fontFamily: 'monospace',
		},
		{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#ffab70' },
		{
			tag: [t.url, t.escape, t.regexp, t.link],
			color: '#79c0ff',
		},
		{ tag: t.link, textDecoration: 'underline' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{
			tag: t.invalid,
			color: '#f97583',
			fontFamily: 'monospace',
		},
	],
})
