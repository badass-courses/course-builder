import { EditorSelection } from '@codemirror/state'

import { ICommand } from '.'

export const underline: ICommand = {
	name: 'underline',
	keyCommand: 'underline',
	button: { 'aria-label': 'Add underline text' },
	icon: (
		<svg fill="currentColor" viewBox="0 0 448 512" height="13" width="13">
			<path d="M416 448H32c-17.69 0-32 14.31-32 32s14.31 32 32 32h384c17.69 0 32-14.31 32-32s-14.3-32-32-32zM48 64.01h16v160c0 88.22 71.78 159.1 160 159.1s160-71.78 160-159.1v-160h16c17.69 0 32-14.32 32-32S417.69.91 400 .91l-96-.005c-17.69 0-32 14.32-32 32s14.31 32 32 32h16v160c0 52.94-43.06 95.1-96 95.1S128 276.1 128 224V64h16c17.69 0 32-14.31 32-32S161.69 0 144 0L48 .005c-17.69 0-32 14.31-32 31.1S30.31 64.01 48 64.01z" />
		</svg>
	),
	execute: ({ state, view }) => {
		if (!state || !view) return
		view.dispatch(
			view.state.changeByRange((range) => ({
				changes: [
					{ from: range.from, insert: '<u>' },
					{ from: range.to, insert: '</u>' },
				],
				range: EditorSelection.range(range.from + 3, range.to + 3),
			})),
		)
	},
}
