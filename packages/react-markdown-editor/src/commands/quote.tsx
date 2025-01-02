import React from 'react'

import { ICommand } from '.'

export const quote: ICommand = {
	name: 'quote',
	keyCommand: 'quote',
	button: { 'aria-label': 'Add quote text' },
	icon: (
		<svg fill="currentColor" viewBox="0 0 448 512" height="15" width="15">
			<path d="M96 96c-53.02 0-96 42.1-96 96s42.98 96 96 96c11.28 0 21.95-2.305 32-5.879V288c0 35.3-28.7 64-64 64-17.67 0-32 14.33-32 32s14.33 32 32 32c70.58 0 128-57.42 128-128v-96c0-53.9-43-96-96-96zm352 96c0-53.02-42.98-96-96-96s-96 42.98-96 96 42.98 96 96 96c11.28 0 21.95-2.305 32-5.879V288c0 35.3-28.7 64-64 64-17.67 0-32 14.33-32 32s14.33 32 32 32c70.58 0 128-57.42 128-128v-96z" />
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		const lineInfo = view.state.doc.lineAt(view.state.selection.main.from)
		let mark = '> '
		const matchMark = lineInfo.text.match(/^>\s/)
		if (matchMark && matchMark[0]) {
			mark = ''
		}
		view.dispatch({
			changes: {
				from: lineInfo.from,
				to: lineInfo.to,
				insert: `${mark}${lineInfo.text}`,
			},
			// selection: EditorSelection.range(lineInfo.from + mark.length, lineInfo.to),
			selection: { anchor: view.state.selection.main.from + mark.length },
		})
	},
}
