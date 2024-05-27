// import { Tag } from "../com/tag";
import * as React from 'react'
import { ChangeEvent, SyntheticEvent, useState } from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { getView } from '@/treehouse/views/views'
import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'
import { useShallow } from 'zustand/react/shallow'

import { Document } from '../com/document'
import { componentsWith, objectCall, objectHas } from '../model/hooks'
import { Node } from '../model/mod'
import { NodeEditor } from './node/editor'

interface Popover {
	onkeydown: Function
	oninput: Function
}

type OutlineEditorProps = {
	path: Path
	alwaysShowNew?: boolean
}

export const OutlineEditor = ({ path, alwaysShowNew }: OutlineEditorProps) => {
	return React.createElement(
		getView((path?.node?.getAttr('view') as any) || 'list'),
		{
			path,
			alwaysShowNew,
		},
	)
}

type OutlineNodeProps = {
	path: Path
}

export const OutlineNode = ({ path }: OutlineNodeProps) => {
	const {
		executeCommand,
		clipboard,
		getExpanded,
		closePopover,
		findAbove,
		focus,
		context,
		showMenu,
	} = useTreehouseStore(
		useShallow((s) => {
			return {
				executeCommand: s.executeCommand,
				clipboard: s.clipboard,
				getExpanded: s.getExpanded,
				closePopover: s.closePopover,
				findAbove: s.findAbove,
				focus: s.focus,
				context: s.context,
				showMenu: s.showMenu,
			}
		}),
	)
	const [hoverState, setHoverState] = useState(false)
	const [tagPopover, setTagPopover] = useState<Popover | undefined>(undefined)
	let node: Node | null = path.node

	if (!node) {
		return null
	}

	let isRef = false
	let handleNode = node
	if (node.refTo) {
		isRef = true
		node = handleNode.refTo
	}

	let isCut = false
	if (clipboard && clipboard.op === 'cut') {
		if (node && clipboard.node.id === node.id) {
			isCut = true
		}
	}

	const expanded = getExpanded(path.head, handleNode)
	const placeholder = objectHas(node, 'handlePlaceholder')
		? objectCall(node, 'handlePlaceholder')
		: ''

	const hover = (e: SyntheticEvent<HTMLDivElement>) => {
		setHoverState(true)
		e.stopPropagation()
	}

	const unhover = (e: SyntheticEvent<HTMLDivElement>) => {
		setHoverState(false)
		e.stopPropagation()
	}

	const cancelTagPopover = () => {
		if (tagPopover) {
			closePopover()
			setTagPopover(undefined)
		}
	}

	const oninput = (e: SyntheticEvent<HTMLTextAreaElement>) => {
		const inputElement = e.target as HTMLTextAreaElement
		if (tagPopover) {
			tagPopover.oninput(e)
			if (!inputElement.value.includes('#')) {
				cancelTagPopover()
			}
		} else {
			if (inputElement.value.includes('#')) {
				setTagPopover({
					onkeydown: () => {},
					oninput: () => {},
				})
				// Don't love that we're hard depending on Tag
				if (!node) return
				// TODO Tags
				// Tag.showPopover(
				//   workbench,
				//   path,
				//   node,
				//   (onkeydown: Function, oninput: Function) => {
				//     state.tagPopover = { onkeydown, oninput };
				//   },
				//   cancelTagPopover,
				// );
			}
		}
	}

	const onkeydown = async (e: React.KeyboardEvent<Element>) => {
		if (tagPopover) {
			if (e.key === 'Escape') {
				cancelTagPopover()
				return
			}
			if (tagPopover.onkeydown(e) === false) {
				e.stopPropagation()
				return
			}
		}
		const anyModifiers = e.shiftKey || e.metaKey || e.altKey || e.ctrlKey
		const inputElement = e.target as HTMLInputElement
		console.log(
			'onkeydown',
			e.key,
			inputElement.selectionStart,
			inputElement.selectionEnd,
		)
		switch (e.key) {
			case 'ArrowUp':
				if (inputElement.selectionStart !== 0 && !anyModifiers) {
					e.stopPropagation()
				}
				break
			case 'ArrowDown':
				if (
					inputElement.selectionStart !== inputElement.value.length &&
					inputElement.selectionStart !== 0 &&
					!anyModifiers
				) {
					e.stopPropagation()
				}
				break
			case 'Backspace':
				// cursor at beginning of empty text
				if (inputElement.value === '') {
					e.preventDefault()
					e.stopPropagation()
					if (!node || node.childCount > 0) {
						return
					}
					executeCommand('delete', { node, path, event: e })
					return
				}
				// cursor at beginning of non-empty text
				if (
					inputElement.value !== '' &&
					inputElement.selectionStart === 0 &&
					inputElement.selectionEnd === 0
				) {
					e.preventDefault()
					e.stopPropagation()
					if (!node || node.childCount > 0) {
						return
					}

					// TODO: make this work as a command?
					const above = findAbove(path)
					if (!above || !above.node) {
						return
					}
					const oldName = above.node?.name
					above.node.name = oldName + inputElement.value
					node?.destroy()
					// m.redraw.sync();
					focus(above, oldName.length)

					return
				}
				break
			case 'Enter':
				e.preventDefault()
				if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return
				// cursor at end of text
				if (inputElement.selectionStart === inputElement.value.length) {
					if ((!node || node.childCount > 0) && getExpanded(path.head, node)) {
						executeCommand('insert-child', { node, path }, '', 0)
					} else {
						executeCommand('insert', { node, path })
					}
					e.stopPropagation()
					return
				}
				// cursor at beginning of text
				if (inputElement.selectionStart === 0) {
					executeCommand('insert-before', { node, path })
					e.stopPropagation()
					return
				}
				// cursor in middle of text
				if (
					inputElement.selectionStart &&
					inputElement.selectionStart > 0 &&
					inputElement.selectionStart < inputElement.value.length
				) {
					executeCommand(
						'insert',
						{ node, path },
						inputElement.value.slice(inputElement.selectionStart),
					).then(() => {
						if (node)
							node.name = inputElement.value.slice(
								0,
								inputElement.selectionStart as number,
							)
					})
					e.stopPropagation()
					return
				}
				break
		}
	}

	const open = (e: SyntheticEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()

		executeCommand('zoom', { node, path })

		// Clear text selection that happens after from double click

		if (document.getSelection() && document.getSelection()?.empty) {
			document.getSelection()?.empty()
		} else if (window.getSelection) {
			window.getSelection()?.removeAllRanges()
		}
	}

	const toggle = (e: SyntheticEvent<HTMLDivElement>) => {
		// TODO: hook or something so to not hardcode
		if (node && node.hasComponent(Document)) {
			open(e)
			return
		}
		if (expanded) {
			executeCommand('collapse', { node: handleNode, path })
		} else {
			executeCommand('expand', { node: handleNode, path })
		}
		e.stopPropagation()
	}

	const subCount = (n: any) => {
		return n.childCount + n.getLinked('Fields').length
	}

	const showHandle = () => {
		if ((node && node.id === context?.node?.id) || hoverState) {
			return true
		}
		if (node && node.name.length > 0) return true
		if (placeholder.length > 0) return true
	}

	return (
		<div
			onMouseOver={hover}
			onMouseOut={unhover}
			id={`node-${path.id}-${handleNode.id}`}
			className={isCut ? 'cut-node' : ''}
		>
			<div className="node-row-outer-wrapper flex flex-row items-start">
				<svg
					className="node-menu shrink-0"
					xmlns="http://www.w3.org/2000/svg"
					onClick={(e: React.MouseEvent<SVGSVGElement>) =>
						showMenu(e, { node: handleNode, path })
					}
					onContextMenu={(e) => showMenu(e, { node: handleNode, path })}
					data-menu="node"
					viewBox="0 0 16 16"
				>
					{hoverState && (
						<path
							style={{ transform: 'translateY(-1px)' }}
							fill="currentColor"
							fillRule="evenodd"
							d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
						/>
					)}
				</svg>
				<div
					className="node-handle shrink-0"
					onClick={toggle}
					onDoubleClick={open}
					onContextMenu={(e) => showMenu(e, { node: handleNode, path })}
					data-menu="node"
					style={{ display: showHandle() ? 'block' : 'none' }}
				>
					{objectHas(node, 'handleIcon') ? (
						objectCall(node, 'handleIcon', subCount(node) > 0 && !expanded)
					) : (
						<svg
							className="node-bullet"
							viewBox="0 0 16 16"
							xmlns="http://www.w3.org/2000/svg"
						>
							{subCount(node) > 0 && !expanded ? (
								<circle id="node-collapsed-handle" cx="8" cy="8" r="8" />
							) : null}
							<circle cx="8" cy="8" r="3" fill="currentColor" />,
							{isRef ? (
								<circle
									id="node-reference-handle"
									cx="8"
									cy="8"
									r="7"
									fill="none"
									stroke-width="1"
									stroke="currentColor"
									stroke-dasharray="3,3"
								/>
							) : null}
						</svg>
					)}
				</div>
				{node && node?.raw.Rel === 'Fields' ? (
					<div className="flex grow flex-row items-start">
						<div>
							<NodeEditor path={path} onkeydown={onkeydown} oninput={oninput} />
						</div>
						<NodeEditor
							editValue={true}
							path={path}
							onkeydown={onkeydown}
							oninput={oninput}
						/>
					</div>
				) : (
					<div
						className="flex grow flex-row items-start"
						style={{ gap: '0.5rem' }}
					>
						{objectHas(node, 'beforeEditor') &&
							componentsWith(node, 'beforeEditor').map((component) =>
								React.createElement(component.beforeEditor(), {
									node,
									component,
								}),
							)}
						<NodeEditor
							path={path}
							onkeydown={onkeydown}
							oninput={oninput}
							placeholder={placeholder}
						/>
						{objectHas(node, 'afterEditor') &&
							componentsWith(node, 'afterEditor').map((component) =>
								React.createElement(component.afterEditor(), {
									node,
									component,
								}),
							)}
					</div>
				)}
			</div>
			{objectHas(node, 'belowEditor') &&
				componentsWith(node, 'belowEditor').map((component) =>
					React.createElement(component.belowEditor(), {
						node,
						component,
						expanded,
					}),
				)}
			{expanded && (
				<div className="expanded-node flex flex-row">
					<div className="indent flex" onClick={toggle}></div>
					<div className="view grow">
						{node &&
							React.createElement(
								getView((node.getAttr('view') as unknown as any) || 'list'),
								{
									path,
								},
							)}
					</div>
				</div>
			)}
		</div>
	)
}
