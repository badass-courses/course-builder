import { ICommand } from '.'

export const header: ICommand = {
	name: 'header',
	keyCommand: 'header',
	button: { 'aria-label': 'Add header text' },
	icon: (
		<svg fill="currentColor" viewBox="0 0 448 512" height="13" width="13">
			<path d="M448 448c0 17.69-14.33 32-32 32h-96c-17.67 0-32-14.31-32-32s14.33-32 32-32h16V272H112v144h16c17.67 0 32 14.31 32 32s-14.33 32-32 32H32c-17.67 0-32-14.31-32-32s14.33-32 32-32h16V96H32C14.33 96 0 81.69 0 64s14.33-32 32-32h96c17.67 0 32 14.31 32 32s-14.33 32-32 32h-16v112h224V96h-16c-17.67 0-32-14.31-32-32s14.33-32 32-32h96c17.67 0 32 14.31 32 32s-14.33 32-32 32h-16v320h16c17.7 0 32 14.3 32 32z" />
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		const lineInfo = view.state.doc.lineAt(view.state.selection.main.from)
		let mark = '#'
		const matchMark = lineInfo.text.match(/^#+/)
		if (matchMark && matchMark[0]) {
			const txt = matchMark[0]
			if (txt.length < 6) {
				mark = txt + '#'
			}
		}
		if (mark.length > 6) {
			mark = '#'
		}
		const title = lineInfo.text.replace(/^#+/, '')
		view.dispatch({
			changes: {
				from: lineInfo.from,
				to: lineInfo.to,
				insert: `${mark} ${title}`,
			},
			// selection: EditorSelection.range(lineInfo.from + mark.length, lineInfo.to),
			selection: { anchor: lineInfo.from + mark.length + 1 },
		})
	},
}
