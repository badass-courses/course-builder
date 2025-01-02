import { EditorSelection } from '@codemirror/state'

import { ICommand } from '.'

export const image: ICommand = {
	name: 'image',
	keyCommand: 'image',
	button: { 'aria-label': 'Add image text' },
	icon: (
		<svg fill="currentColor" viewBox="0 0 16 16" height="14" width="14">
			<path
				fillRule="evenodd"
				d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h.94a.76.76 0 0 1 .03-.03l6.077-6.078a1.75 1.75 0 0 1 2.412-.06L14.5 10.31V2.75a.25.25 0 0 0-.25-.25H1.75zm12.5 11H4.81l5.048-5.047a.25.25 0 0 1 .344-.009l4.298 3.889v.917a.25.25 0 0 1-.25.25zm1.75-.25V2.75A1.75 1.75 0 0 0 14.25 1H1.75A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25zM5.5 6a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM7 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
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
				insert: `![](${txt})`,
			},
			selection: EditorSelection.range(main.from + 4, main.to + 4),
			// selection: { anchor: main.from + 4 },
		})
	},
}
