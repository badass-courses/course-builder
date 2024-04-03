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
	})

	return (
		<div className="h-full flex-shrink-0">
			<div ref={codemirrorElementRef}></div>
		</div>
	)
}

const CourseBuilderEditorStyles = {
	'.cm-content, .cm-gutter': {
		minHeight: '100%',
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
	const [currentText, setCurrentText] = useState<string>('')

	console.log({ theme })

	useEffect(() => {
		let view: EditorView

		const highlight_effect = StateEffect.define<Range<Decoration>[]>()

		const highlight_extension = StateField.define({
			create() {
				return Decoration.none
			},
			update(value, transaction) {
				value = value.map(transaction.changes)

				for (let effect of transaction.effects) {
					if (effect.is(highlight_effect))
						value = value.update({ add: effect.value, sort: true })
				}

				return value
			},
			provide: (f) => EditorView.decorations.from(f),
		})

		let provider = partykitUrl
			? new YPartyKitProvider(partykitUrl, roomName)
			: null

		if (!element) {
			return
		}

		const ytext =
			provider?.doc.getText('codemirror') || new Y.Doc().getText('codemirror')

		const undoManager = new Y.UndoManager(ytext)
		setYUndoManager(undoManager)

		let updateListenerExtension = EditorView.updateListener.of(
			async (update) => {
				if (update.docChanged) {
					const docText = update.state.doc.toString()
					const hash = await generateHash(docText)
					if (hash !== currentText) {
						onChange(docText)
						setCurrentText(hash)
					}
				}
			},
		)

		const awareness = provider?.awareness

		if (user && awareness) {
			awareness.setLocalStateField('user', {
				...user,
				color: '#ffb61e', // should be a hex color
			})
		}

		// Set up CodeMirror and extensions
		const state = EditorState.create({
			doc: ytext.toString(),
			extensions: [
				basicSetup,
				highlight_extension,
				updateListenerExtension,
				theme === 'dark'
					? CourseBuilderEditorThemeDark
					: CourseBuilderEditorThemeLight,
				markdown({
					codeLanguages: languages,
				}),
				...(provider
					? [yCollab(ytext, provider.awareness, { undoManager })]
					: []),
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
			provider?.doc?.destroy()
			provider?.destroy()
			view?.destroy()
		}
	}, [element, roomName, value, user, theme])

	return {
		codemirrorElementRef: useCallback((node: HTMLElement | null) => {
			if (!node) return
			setElement(node)
		}, []),
	}
}

const CourseBuilderEditorThemeLight = createTheme({
	theme: 'light',
	settings: {
		fontFamily: 'var(--font-sans)',
		background: 'hsl(var(--background))',
		backgroundImage: '',
		foreground: 'hsl(var(--foreground))',
		caret: '#0080ff',
		selection: '#BBDFFF',
		selectionMatch: '#BBDFFF',
		gutterBorder: '1px solid #E2E8F0',
		gutterBackground: 'hsl(var(--background))',
		gutterForeground: '#BCC3CE',
	},
	styles: [
		{ tag: t.heading1, class: 'cm-heading-1' },
		{ tag: t.link, color: '#0080ff' },
		// github light
		{ tag: [t.standard(t.tagName), t.tagName], color: '#116329' },
		{ tag: [t.comment, t.bracket], color: '#6a737d' },
		{ tag: [t.className, t.propertyName], color: '#6f42c1' },
		{
			tag: [t.variableName, t.attributeName, t.number, t.operator],
			color: '#005cc5',
		},
		{
			tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
			color: '#d73a49',
		},
		{ tag: [t.string, t.meta, t.regexp], color: '#032f62' },
		{ tag: [t.name, t.quote], color: '#22863a' },
		{ tag: [t.heading, t.strong], color: '#24292e', fontWeight: 'bold' },
		{ tag: [t.emphasis], color: '#24292e', fontStyle: 'italic' },
		{ tag: [t.deleted], color: '#b31d28', backgroundColor: 'ffeef0' },
		{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#e36209' },
		{ tag: [t.url, t.escape, t.regexp, t.link], color: '#0080ff' },
		{ tag: t.link, textDecoration: 'underline' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{ tag: t.invalid, color: '#cb2431' },
	],
})
const CourseBuilderEditorThemeDark = createTheme({
	theme: 'dark',
	settings: {
		fontFamily: 'var(--font-sans)',
		background: 'hsl(var(--background))',
		backgroundImage: '',
		foreground: 'hsl(var(--foreground))',
		caret: '#0080ff',
		selection: '#003d73',
		selectionMatch: '#003d73',
		lineHighlight: '#36334280',
		gutterBorder: '1px solid hsl(var(--border))',
		gutterBackground: 'hsl(var(--background))',
		gutterForeground: 'hsl(var(--foreground))',
	},
	styles: [
		{ tag: t.heading1, class: 'cm-heading-1' },
		{ tag: t.link, color: '#0080ff' },
		// github dark
		{ tag: [t.standard(t.tagName), t.tagName], color: '#7ee787' },
		{ tag: [t.comment, t.bracket], color: '#8b949e' },
		{ tag: [t.className, t.propertyName], color: '#d2a8ff' },
		{
			tag: [t.variableName, t.attributeName, t.number, t.operator],
			color: '#79c0ff',
		},
		{
			tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
			color: '#ff7b72',
		},
		{ tag: [t.string, t.meta, t.regexp], color: '#a5d6ff' },
		{ tag: [t.name, t.quote], color: '#7ee787' },
		{ tag: [t.heading, t.strong], color: '#d2a8ff', fontWeight: 'bold' },
		{ tag: [t.emphasis], color: '#d2a8ff', fontStyle: 'italic' },
		{ tag: [t.deleted], color: '#ffdcd7', backgroundColor: 'ffeef0' },
		{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#ffab70' },
		{ tag: [t.url, t.escape, t.regexp, t.link], color: '#79c0ff' },
		{ tag: t.link, textDecoration: 'underline' },
		{ tag: t.strikethrough, textDecoration: 'line-through' },
		{ tag: t.invalid, color: '#f97583' },
	],
})
