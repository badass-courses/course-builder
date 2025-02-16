import {
	Fragment,
	memo,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { removePostFromList } from '@/lib/lists-query'
import { cn } from '@/utils/cn'
import {
	Instruction,
	ItemMode,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/types'
import { token } from '@atlaskit/tokens'
import { ChevronDown, ChevronUp, Dot, ExternalLink, Trash } from 'lucide-react'
import pluralize from 'pluralize'
import { createRoot } from 'react-dom/client'
import invariant from 'tiny-invariant'

import { Button } from '@coursebuilder/ui'

import { useSelection } from '../../../selection-context'
import { TreeItem as TreeItemType } from '../../data/tree'
import { TierSelect } from '../tier-select'
import { indentPerLevel } from './constants'
import { DependencyContext, TreeContext } from './tree-context'

const iconColor = token('color.icon', '#44546F')

function ChildIcon() {
	return (
		<svg aria-hidden={true} width={24} height={24} viewBox="0 0 24 24">
			<circle cx={12} cy={12} r={2} fill={iconColor} />
		</svg>
	)
}

function GroupIcon({ isOpen }: { isOpen: boolean }) {
	const Icon = isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
	return (
		<span className="mr-2 flex items-center justify-center text-neutral-500">
			{Icon}
		</span>
	)
}

function Icon({ item }: { item: TreeItemType }) {
	if (!item.children.length) {
		return <Dot className="mr-1 w-3 opacity-50" /> // <ChildIcon />
	}
	return <GroupIcon isOpen={item.isOpen ?? false} />
}

function Preview({ item }: { item: TreeItemType }) {
	return (
		<div className="rounded-s bg-red-300 p-[var(--grid)]">Item {item.id}</div>
	)
}

function getParentLevelOfInstruction(instruction: Instruction): number {
	if (instruction.type === 'instruction-blocked') {
		return getParentLevelOfInstruction(instruction.desired)
	}
	if (instruction.type === 'reparent') {
		return instruction.desiredLevel - 1
	}
	return instruction.currentLevel - 1
}

function delay({
	waitMs: timeMs,
	fn,
}: {
	waitMs: number
	fn: () => void
}): () => void {
	let timeoutId: number | null = window.setTimeout(() => {
		timeoutId = null
		fn()
	}, timeMs)
	return function cancel() {
		if (timeoutId) {
			window.clearTimeout(timeoutId)
			timeoutId = null
		}
	}
}

const TreeItem = memo(function TreeItem({
	item,
	mode,
	level,
	refresh = () => {},
	index,
	showTierSelector = false,
}: {
	item: TreeItemType
	mode: ItemMode
	level: number
	refresh?: () => void
	index: number
	showTierSelector?: boolean
}) {
	const buttonRef = useRef<HTMLButtonElement>(null)
	const { excludedIds, setExcludedIds } = useSelection()
	const [state, setState] = useState<
		'idle' | 'dragging' | 'preview' | 'parent-of-instruction'
	>('idle')
	const [instruction, setInstruction] = useState<Instruction | null>(null)
	const cancelExpandRef = useRef<(() => void) | null>(null)

	const {
		dispatch,
		uniqueContextId,
		getPathToItem,
		rootResource,
		rootResourceId,
	} = useContext(TreeContext)
	const { DropIndicator, attachInstruction, extractInstruction } =
		useContext(DependencyContext)
	const toggleOpen = useCallback(() => {
		dispatch({ type: 'toggle', itemId: item.id })
	}, [dispatch, item])

	const cancelExpand = useCallback(() => {
		cancelExpandRef.current?.()
		cancelExpandRef.current = null
	}, [])

	const clearParentOfInstructionState = useCallback(() => {
		setState((current) =>
			current === 'parent-of-instruction' ? 'idle' : current,
		)
	}, [])

	// When an item has an instruction applied
	// we are highlighting it's parent item for improved clarity
	const shouldHighlightParent = useCallback(
		(location: DragLocationHistory): boolean => {
			const target = location.current.dropTargets[0]

			if (!target) {
				return false
			}

			const instruction = extractInstruction(target.data)

			if (!instruction) {
				return false
			}

			const targetId = target.data.id
			invariant(typeof targetId === 'string')

			const path = getPathToItem(targetId)
			const parentLevel: number = getParentLevelOfInstruction(instruction)
			const parentId = path[parentLevel]
			return parentId === item.id
		},
		[getPathToItem, extractInstruction, item],
	)

	useEffect(() => {
		invariant(buttonRef.current)

		function updateIsParentOfInstruction({
			location,
		}: {
			location: DragLocationHistory
		}) {
			if (shouldHighlightParent(location)) {
				setState('parent-of-instruction')
				return
			}
			clearParentOfInstructionState()
		}

		return combine(
			draggable({
				element: buttonRef.current,
				getInitialData: () => ({
					id: item.id,
					type: 'tree-item',
					isOpenOnDragStart: item.isOpen,
					uniqueContextId,
					item: item,
				}),
				onGenerateDragPreview: ({ nativeSetDragImage }) => {
					setCustomNativeDragPreview({
						getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
						render: ({ container }) => {
							const root = createRoot(container)
							root.render(<Preview item={item} />)
							return () => root.unmount()
						},
						nativeSetDragImage,
					})
				},
				onDragStart: ({ source }) => {
					setState('dragging')
					// collapse open items during a drag
					if (source.data.isOpenOnDragStart) {
						dispatch({ type: 'collapse', itemId: item.id })
					}
				},
				onDrop: ({ source }) => {
					setState('idle')
					if (source.data.isOpenOnDragStart) {
						dispatch({ type: 'expand', itemId: item.id })
					}
				},
			}),
			dropTargetForElements({
				element: buttonRef.current,
				getData: ({ input, element, source }) => {
					const data = { id: item.id }

					return attachInstruction(data, {
						input,
						element,
						indentPerLevel,
						currentLevel: level,
						mode,
						block:
							(source.data.item as any).type === 'section' ||
							item.type !== 'section'
								? ['make-child']
								: [],
					})
				},
				canDrop: (allData) => {
					const { source } = allData
					return (
						source.data.type === 'tree-item' &&
						source.data.uniqueContextId === uniqueContextId
					)
				},

				getIsSticky: () => true,
				onDrag: ({ self, source }) => {
					const instruction = extractInstruction(self.data)

					if (source.data.id !== item.id) {
						// expand after 500ms if still merging
						if (
							instruction?.type === 'make-child' &&
							item.children.length &&
							!item.isOpen &&
							!cancelExpandRef.current
						) {
							cancelExpandRef.current = delay({
								waitMs: 500,
								fn: () => dispatch({ type: 'expand', itemId: item.id }),
							})
						}
						if (instruction?.type !== 'make-child' && cancelExpandRef.current) {
							cancelExpand()
						}

						setInstruction(instruction)
						return
					}
					if (instruction?.type === 'reparent') {
						setInstruction(instruction)
						return
					}
					setInstruction(null)
				},
				onDragLeave: () => {
					cancelExpand()
					setInstruction(null)
				},
				onDrop: () => {
					cancelExpand()
					setInstruction(null)
				},
			}),
			monitorForElements({
				canMonitor: ({ source }) =>
					source.data.uniqueContextId === uniqueContextId,
				onDragStart: updateIsParentOfInstruction,
				onDrag: updateIsParentOfInstruction,
				onDrop() {
					clearParentOfInstructionState()
				},
			}),
		)
	}, [
		dispatch,
		item,
		mode,
		level,
		cancelExpand,
		uniqueContextId,
		extractInstruction,
		attachInstruction,
		getPathToItem,
		clearParentOfInstructionState,
		shouldHighlightParent,
	])

	useEffect(
		function mount() {
			return function unmount() {
				cancelExpand()
			}
		},
		[cancelExpand],
	)

	const aria = (() => {
		// if there are no children, we don't need to set aria attributes

		if (!item.children.length) {
			return undefined
		}

		return {
			'aria-expanded': item.isOpen,
			'aria-controls': `tree-item-${item.id}--subtree`,
		}
	})()

	const router = useRouter()

	return (
		<Fragment>
			<div
				className={cn('relative flex items-center', {
					'cursor-move': state === 'idle',
				})}
			>
				<button
					{...aria}
					className={cn(
						'hover:bg-muted/50 relative w-full cursor-pointer border-0 bg-transparent py-3',
						{
							'border-primary border': instruction?.type === 'make-child',
							'cursor-move': state === 'idle',
						},
					)}
					id={`tree-item-${item.id}`}
					onClick={item.type === 'section' ? toggleOpen : () => {}}
					ref={buttonRef}
					type="button"
					style={{ paddingLeft: level * indentPerLevel }}
				>
					<span
						className={cn(
							'flex flex-col items-center justify-between gap-3 bg-transparent px-5 sm:flex-row',
							{
								'opacity-40': state === 'dragging',
								transparent: state === 'parent-of-instruction',
							},
						)}
					>
						<div className="flex w-full flex-row items-center">
							{/* <Icon item={item} /> */}
							<span className="mr-2 min-w-[15px] text-xs opacity-50">
								{index + 1}
							</span>
							<span
								className={cn('text-left', {
									'font-semibold': item.type === 'section',
								})}
							>
								{item.label ?? item.id}
							</span>
						</div>
						<small className="text-ellipsis opacity-50">
							{item.type ? (
								<span className="capitalize">{item.type}</span>
							) : null}

							{/* <span className="text-xs opacity-50">({mode})</span> */}
						</small>
					</span>
					{instruction ? (
						<div
							className={cn('bg-primary absolute left-0 h-px w-full', {
								'top-0': instruction.type === 'reorder-above',
								'bottom-0': instruction.type === 'reorder-below',
								'opacity-0': instruction.type === 'instruction-blocked',
							})}
						/>
					) : null}
				</button>
				<div className="flex items-center gap-2 px-3">
					{showTierSelector && item.type !== 'section' && (
						<TierSelect item={item} dispatch={dispatch} />
					)}
					<Button
						className="hover:bg-secondary h-6 w-6"
						type="button"
						variant="outline"
						size="icon"
						onClick={() => {
							if (
								item.itemData?.resource?.fields?.slug &&
								item.type &&
								item.type !== 'section'
							) {
								router.push(
									`/${pluralize(item.type)}/${item.itemData.resource.fields.slug}/edit`,
								)
							}
						}}
					>
						<ExternalLink className="h-3 w-3" />
					</Button>
					<Button
						className="h-6 w-6"
						type="button"
						variant="outline"
						size="icon"
						onClick={async () => {
							if (rootResourceId) {
								dispatch({ type: 'remove-item', itemId: item.id })
								const resourceId = item?.itemData?.resource?.id || item?.id // this is important because newly added items don't have itemData
								if (resourceId && excludedIds.includes(resourceId)) {
									setExcludedIds((prev) =>
										prev.filter((id) => id !== resourceId),
									)
									refresh()
								}
								await removePostFromList({
									postId: item.id,
									listId: rootResourceId,
								})
							}
						}}
					>
						<Trash className="h-3 w-3" />
					</Button>
				</div>
			</div>
			{item.children.length && item.isOpen ? (
				<div id={aria?.['aria-controls']}>
					{item.children.map((child, index, array) => {
						const childType: ItemMode = (() => {
							if (child.children.length && child.isOpen) {
								return 'expanded'
							}

							if (index === array.length - 1) {
								return 'last-in-group'
							}

							return 'standard'
						})()
						return (
							<TreeItem
								refresh={refresh}
								item={child}
								key={child.id}
								level={level + 1}
								mode={childType}
								index={index}
								showTierSelector={showTierSelector}
							/>
						)
					})}
				</div>
			) : null}
		</Fragment>
	)
})

export default TreeItem
