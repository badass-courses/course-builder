import { useCallback } from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Node } from '@/treehouse/model/mod'
import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'
import { useShallow } from 'zustand/react/shallow'

import { Page } from '../com/page'
import { NodeEditor } from './node/editor'
import { OutlineEditor } from './outline'

interface PanelProps {
	path: Path
}

export const Panel: React.FC<PanelProps> = ({ path }) => {
	const { executeCommand, open, showMenu } = useTreehouseStore(
		useShallow((s) => {
			return {
				executeCommand: s.executeCommand,
				open: s.open,
				showMenu: s.showMenu,
			}
		}),
	)

	const panels = useTreehouseStore((state) => state.panels)
	const context = useTreehouseStore((state) => state.context)

	const node = path.node

	const close = useCallback(() => {
		executeCommand('close-panel', {}, path)
	}, [path])

	const goBack = useCallback(() => {
		let node = path.pop()
		if (node === path.node) {
			path.pop()
		}
	}, [path])

	const maximize = useCallback(() => {
		useTreehouseStore.setState({
			context: { ...context, path: path },
			panels: [path],
		})
	}, [path, context])

	const editMarkdown = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			node.getComponent(Page).markdown = e.target.value
			node.changed()
		},
		[node],
	)

	const calcHeight = useCallback((value: string = '') => {
		let numberOfLineBreaks = (value.match(/\n/g) || []).length
		let newHeight = 20 + numberOfLineBreaks * 20
		return newHeight
	}, [])

	let viewClass = ''

	if (node.getAttr('view')) {
		viewClass = `${node.getAttr('view')}-panel`
	}

	return (
		<div className={`panel flex grow flex-col ${viewClass}`}>
			<div className="bar flex">
				{path.length > 1 && (
					<div
						className="panel-back"
						style={{ paddingRight: 'var(--padding)' }}
					>
						{/* SVG for goBack */}
					</div>
				)}

				<div className="panel-back-parent grow">
					{node.parent && node.parent.id !== '@root' ? (
						<span
							style={{ cursor: 'pointer' }}
							onClick={() => open(node.parent as Node)}
						>
							{node.parent.name}
						</span>
					) : (
						<span> </span>
					)}
				</div>

				{panels.length > 1 && (
					<div className="panel-icons flex items-center">
						{/* SVGs for maximize and close */}
					</div>
				)}
			</div>

			<div className="body flex flex-col">
				<div
					className="title-node"
					onContextMenu={(e) => showMenu(e, { node, path })}
					data-menu="node"
				>
					<NodeEditor path={path} disallowEmpty={true} />
				</div>
				{node.hasComponent(Page) && (
					<textarea
						onChange={editMarkdown}
						value={node.getComponent(Page).markdown}
						placeholder="Enter Markdown text here"
						style={{
							marginLeft: 'var(--padding)',
							padding: 'var(--padding)',
							outline: '0',
							height: `${calcHeight(node.getComponent(Page).markdown)}px`,
							border: '0',
						}}
					/>
				)}
				<OutlineEditor path={path.sub()} alwaysShowNew={true} />
			</div>
		</div>
	)
}
