import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useParams } from 'next/navigation'
import { updateResourcePositions } from '@/lib/posts-query'
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash'
import {
	Instruction,
	ItemMode,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import memoizeOne from 'memoize-one'
import invariant from 'tiny-invariant'

import { Product } from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/schemas'

import {
	tree,
	TreeAction,
	TreeItem as TreeItemType,
	TreeState,
} from './data/tree'
import {
	DependencyContext,
	TreeContext,
	TreeContextValue,
} from './pieces/tree/tree-context'
import TreeItem from './pieces/tree/tree-item'

type CleanupFn = () => void

function createTreeItemRegistry() {
	const registry = new Map<
		string,
		{ element: HTMLElement; actionMenuTrigger: HTMLElement }
	>()

	const registerTreeItem = ({
		itemId,
		element,
		actionMenuTrigger,
	}: {
		itemId: string
		element: HTMLElement
		actionMenuTrigger: HTMLElement
	}): CleanupFn => {
		registry.set(itemId, { element, actionMenuTrigger })
		return () => {
			registry.delete(itemId)
		}
	}

	return { registry, registerTreeItem }
}

export default function Tree({
	state,
	updateState,
	rootResourceId,
	rootResource,
	onItemDelete,
	onItemEdit,
}: {
	state: TreeState
	updateState: React.Dispatch<TreeAction>
	rootResourceId: string
	rootResource: ContentResource | Product
	onItemDelete: ({ itemId }: { itemId: string }) => Promise<void>
	onItemEdit?: ({ itemId }: { itemId: string }) => Promise<void>
}) {
	const params = useParams<{ module: string }>()

	const ref = useRef<HTMLDivElement>(null)
	const { extractInstruction } = useContext(DependencyContext)

	const [{ registry, registerTreeItem }] = useState(createTreeItemRegistry)

	const { data, lastAction } = state
	let lastStateRef = useRef<TreeItemType[]>(data)
	useEffect(() => {
		lastStateRef.current = data
	}, [data])

	const saveTreeData = useCallback(async () => {
		const currentData = lastStateRef.current

		const resourcePositions = currentData.flatMap((item, index) => {
			if (!item.itemData) return []

			if (!item.itemData.resourceId || !item.itemData.resourceOfId) {
				console.error('Missing required fields in item:', item)
				return []
			}

			const children = item.children.flatMap((childItem, childIndex) => {
				if (!childItem.itemData) return []

				if (
					!childItem.itemData.resourceId ||
					!childItem.itemData.resourceOfId
				) {
					console.error('Missing required fields in child item:', childItem)
					return []
				}

				return {
					currentParentResourceId: childItem.itemData.resourceOfId,
					parentResourceId: item.itemData?.resourceId as string,
					resourceId: childItem.itemData.resourceId,
					position: childIndex,
				}
			})

			return [
				{
					currentParentResourceId: item.itemData.resourceOfId,
					parentResourceId: rootResourceId,
					resourceId: item.itemData.resourceId,
					position: index,
					children,
				},
			]
		})

		if (resourcePositions.length > 0) {
			await updateResourcePositions(resourcePositions)
		} else {
			console.warn('No valid resource positions to update')
		}
	}, [rootResourceId])

	useEffect(() => {
		if (lastAction === null) {
			return
		}

		if (lastAction.type === 'toggle') {
			return
		}

		saveTreeData()

		if (lastAction.type === 'modal-move') {
			const parentName =
				lastAction.targetId === '' ? 'the root' : `Item ${lastAction.targetId}`

			liveRegion.announce(
				`You've moved Item ${lastAction.itemId} to position ${lastAction.index + 1} in ${parentName}.`,
			)

			const { element, actionMenuTrigger } =
				registry.get(lastAction.itemId) ?? {}
			if (element) {
				triggerPostMoveFlash(element)
			}

			/**
			 * Only moves triggered by the modal will result in focus being
			 * returned to the trigger.
			 */
			actionMenuTrigger?.focus()

			return
		}

		if (lastAction.type === 'instruction') {
			const { element } = registry.get(lastAction.itemId) ?? {}
			if (element) {
				triggerPostMoveFlash(element)
			}

			return
		}
	}, [lastAction, registry, saveTreeData, rootResourceId])

	useEffect(() => {
		return () => {
			liveRegion.cleanup()
		}
	}, [])

	/**
	 * Returns the items that the item with `itemId` can be moved to.
	 *
	 * Uses a depth-first search (DFS) to compile a list of possible targets.
	 */
	const getMoveTargets = useCallback(({ itemId }: { itemId: string }) => {
		const data = lastStateRef.current

		const targets = []

		const searchStack = Array.from(data)
		while (searchStack.length > 0) {
			const node = searchStack.pop()

			if (!node) {
				continue
			}

			/**
			 * If the current node is the item we want to move, then it is not a valid
			 * move target and neither are its children.
			 */
			if (node.id === itemId) {
				continue
			}

			/**
			 * Draft items cannot have children.
			 */
			if (node.isDraft) {
				continue
			}

			targets.push(node)

			node.children.forEach((childNode) => searchStack.push(childNode))
		}

		return targets
	}, [])

	const getChildrenOfItem = useCallback((itemId: string) => {
		const data = lastStateRef.current

		/**
		 * An empty string is representing the root
		 */
		if (itemId === '') {
			return data
		}

		const item = tree.find(data, itemId)
		invariant(item)
		return item.children
	}, [])

	const context = useMemo<TreeContextValue>(
		() => ({
			dispatch: updateState,
			uniqueContextId: Symbol('unique-id'),
			// memoizing this function as it is called by all tree items repeatedly
			// An ideal refactor would be to update our data shape
			// to allow quick lookups of parents
			getPathToItem: memoizeOne(
				(targetId: string) =>
					tree.getPathToItem({ current: lastStateRef.current, targetId }) ?? [],
			),
			getMoveTargets,
			getChildrenOfItem,
			registerTreeItem,
			rootResourceId,
			rootResource,
		}),
		[
			getChildrenOfItem,
			getMoveTargets,
			registerTreeItem,
			updateState,
			rootResourceId,
			rootResource,
		],
	)

	useEffect(() => {
		invariant(ref.current)
		return combine(
			monitorForElements({
				canMonitor: ({ source }) =>
					source.data.uniqueContextId === context.uniqueContextId,
				onDrop(args) {
					const { location, source } = args
					// didn't drop on anything
					if (!location.current.dropTargets.length) {
						return
					}

					if (source.data.type === 'tree-item') {
						const itemId = source.data.id as string

						const target = location.current.dropTargets[0]

						if (!target?.data) {
							throw new Error('target.data is undefined')
						}

						const targetId = target.data.id as string

						const instruction: Instruction | null = extractInstruction(
							target.data,
						)

						if (instruction !== null) {
							updateState({
								type: 'instruction',
								instruction,
								itemId,
								targetId,
							})
						}
					}
				},
			}),
		)
	}, [context, extractInstruction, updateState])

	return (
		<TreeContext.Provider value={context}>
			<div>
				<div className="flex flex-col" id="tree" ref={ref}>
					{data.map((item, index, array) => {
						const type: ItemMode = (() => {
							if (item.children.length && item.isOpen) {
								return 'expanded'
							}

							if (index === array.length - 1) {
								return 'last-in-group'
							}

							return 'standard'
						})()

						return (
							<TreeItem
								item={item}
								level={0}
								key={item.id}
								mode={type}
								onDelete={onItemDelete}
								onEdit={onItemEdit}
							/>
						)
					})}
				</div>
			</div>
		</TreeContext.Provider>
	)
}
