import { EditorSelection } from '@codemirror/state'

import { ICommand } from '.'

export const code: ICommand = {
	name: 'code',
	keyCommand: 'code',
	button: { 'aria-label': 'Insert code' },
	icon: (
		<svg viewBox="0 0 48 48" fill="none" height="15" width="15">
			<path
				d="M16 13 4 25.432 16 37m16-24 12 12.432L32 37"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="m28 4-7 40"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
			/>
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		view.dispatch(
			view.state.changeByRange((range) => ({
				changes: [
					{ from: range.from, insert: '`' },
					{ from: range.to, insert: '`' },
				],
				range: EditorSelection.range(range.from + 1, range.to + 1),
			})),
		)
	},
}

export const codeBlock: ICommand = {
	name: 'codeBlock',
	keyCommand: 'codeBlock',
	button: { 'aria-label': 'Insert Code Block' },
	icon: (
		<svg viewBox="0 0 48 48" fill="none" height="15" width="15">
			<path
				d="M21 6H9a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h30a3 3 0 0 0 3-3V21M24 34v8"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="m32 6-4 4 4 4m6-8 4 4-4 4M14 42h20"
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		const main = view.state.selection.main
		const txt = view.state.sliceDoc(
			view.state.selection.main.from,
			view.state.selection.main.to,
		)
		view.dispatch({
			changes: {
				from: main.from,
				to: main.to,
				insert: `\`\`\`js\n${txt}\n\`\`\``,
			},
			selection: EditorSelection.range(main.from + 3, main.from + 5),
		})
	},
}
