import { Extension } from '@codemirror/state'
import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'

export const defaultTheme: Extension = createTheme({
	theme: 'light',
	settings: {
		background: 'var(--color-canvas-subtle)',
		foreground: 'var(--color-fg-default)',
		caret: 'var(--color-fg-default)',
		selection: 'var(--color-border-default)',
		selectionMatch: 'var(--color-border-muted)',
		lineHighlight: 'var(--color-neutral-muted)',
		gutterBackground: 'var(--color-canvas-subtle)',
		gutterForeground: 'var(--color-fg-muted)',
		gutterBorder: 'var(--color-border-muted)',
	},
	styles: [
		{ tag: t.comment, color: 'var(--color-prettylights-syntax-comment)' },
		{ tag: t.variableName, color: 'var(--color-prettylights-syntax-variable)' },
		{
			tag: [t.string, t.special(t.brace)],
			color: 'var(--color-prettylights-syntax-entity)',
		},
		{ tag: t.number, color: 'var(--color-prettylights-syntax-variable)' },
		{ tag: [t.bool, t.null], color: 'var(--color-prettylights-syntax-entity)' },
		{
			tag: t.keyword,
			color: 'var(--color-prettylights-syntax-keyword)',
			fontWeight: 'bold',
		},
		{ tag: t.string, color: 'var(--color-prettylights-syntax-string)' },
		{ tag: t.operator, color: 'var(--color-accent-emphasis)' },
		{
			tag: t.deleted,
			color: 'var(--color-prettylights-syntax-markup-deleted-bg)',
		},
		{ tag: t.deleted, color: 'red' },
		{ tag: t.className, color: 'var(--color-prettylights-syntax-variable)' },
		{
			tag: t.definition(t.typeName),
			color: 'var(--color-prettylights-syntax-entity)',
		},
		{ tag: t.typeName, color: 'var(--color-prettylights-syntax-entity)' },
		{ tag: t.list, color: 'var(--color-prettylights-syntax-markup-list)' },
		{
			tag: t.heading,
			color: 'var(--color-prettylights-syntax-markup-heading)',
			fontWeight: 'bold',
		},
		{ tag: t.regexp, color: 'var(--color-prettylights-syntax-string-regexp)' },
		{ tag: t.literal, color: 'var(--color-prettylights-syntax-markup-italic)' },
		{
			tag: t.link,
			color: 'var(--color-prettylights-syntax-constant-other-reference-link)',
			textDecoration: 'underline',
		},
		{ tag: t.angleBracket, color: 'var(--color-fg-default)' },
		{ tag: t.tagName, color: 'var(--color-prettylights-syntax-entity-tag)' },
		{
			tag: t.attributeName,
			color: 'var(--color-prettylights-syntax-constant)',
		},
	],
})
