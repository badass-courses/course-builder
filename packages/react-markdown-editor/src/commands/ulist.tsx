import React from 'react'

import { ICommand } from '.'

export const ulist: ICommand = {
	name: 'ulist',
	keyCommand: 'ulist',
	button: { 'aria-label': 'Add ulist text' },
	icon: (
		<svg viewBox="0 0 512 512" height="14" width="14">
			<path
				fill="currentColor"
				d="M88 48c13.3 0 24 10.75 24 24v48c0 13.3-10.7 24-24 24H40c-13.25 0-24-10.7-24-24V72c0-13.25 10.75-24 24-24h48zm392 16c17.7 0 32 14.33 32 32 0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32 0-17.67 14.3-32 32-32h288zm0 160c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32h288zm0 160c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32h288zM16 232c0-13.3 10.75-24 24-24h48c13.3 0 24 10.7 24 24v48c0 13.3-10.7 24-24 24H40c-13.25 0-24-10.7-24-24v-48zm72 136c13.3 0 24 10.7 24 24v48c0 13.3-10.7 24-24 24H40c-13.25 0-24-10.7-24-24v-48c0-13.3 10.75-24 24-24h48z"
			/>
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		const lineInfo = view.state.doc.lineAt(view.state.selection.main.from)
		let mark = '- '
		const matchMark = lineInfo.text.match(/^-/)
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
