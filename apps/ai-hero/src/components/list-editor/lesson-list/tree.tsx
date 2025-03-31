import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useParams } from 'next/navigation'
import { batchUpdateResourcePositions } from '@/lib/tutorials-query'
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

import { ResourceList } from '../resource-list'
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

// Debug utilities
const DEBUG = false // process.env.NODE_ENV === 'development'

interface PerformanceMetrics {
	dragOperations: number
	lastDragDuration: number
	averageDragDuration: number
	totalDragTime: number
	lastSaveTime: number
	saveDuration: number
	saveOperations: number
}

const perfMetrics: PerformanceMetrics = {
	dragOperations: 0,
	lastDragDuration: 0,
	averageDragDuration: 0,
	totalDragTime: 0,
	lastSaveTime: 0,
	saveDuration: 0,
	saveOperations: 0,
}

// Add a debounce utility at the top
function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => {
			timeout = null
			func(...args)
		}, wait)
	}
}

export default function Tree({
	state,
	updateState,
	rootResourceId,
	rootResource,
	onRefresh,
	showTierSelector = false,

	onResourceUpdate,
}: {
	state: TreeState
	updateState: React.Dispatch<TreeAction>
	rootResourceId: string
	rootResource: ContentResource | Product
	onRefresh?: () => void
	showTierSelector?: boolean
	onResourceUpdate?: (
		itemId: string,
		fields: Record<string, any>,
	) => Promise<void>
}) {
	const ref = useRef<HTMLDivElement>(null)
	const { extractInstruction } = useContext(DependencyContext)
	const dragStartTimeRef = useRef<number>(0)

	const [{ registry, registerTreeItem }] = useState(createTreeItemRegistry)

	const { data, lastAction } = state
	let lastStateRef = useRef<TreeItemType[]>(data)
	useEffect(() => {
		lastStateRef.current = data
	}, [data])

	// Performance monitoring
	useEffect(() => {
		if (!DEBUG) return

		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.entryType === 'measure' && entry.name === 'drag-operation') {
					perfMetrics.dragOperations++
					perfMetrics.lastDragDuration = entry.duration
					perfMetrics.totalDragTime += entry.duration
					perfMetrics.averageDragDuration =
						perfMetrics.totalDragTime / perfMetrics.dragOperations

					console.log('Drag Performance Metrics:', {
						operations: perfMetrics.dragOperations,
						lastDuration: perfMetrics.lastDragDuration.toFixed(2) + 'ms',
						avgDuration: perfMetrics.averageDragDuration.toFixed(2) + 'ms',
						totalTime: perfMetrics.totalDragTime.toFixed(2) + 'ms',
					})
				}
			}
		})

		observer.observe({ entryTypes: ['measure'] })
		return () => observer.disconnect()
	}, [])

	const [isSaving, setIsSaving] = useState(false)
	const [lastSaveError, setLastSaveError] = useState<string | null>(null)
	const saveInProgressRef = useRef(false)

	const saveTreeData = useCallback(async () => {
		// Prevent concurrent saves
		if (saveInProgressRef.current) {
			if (DEBUG) console.log('Save already in progress, skipping...')
			return
		}

		if (DEBUG) {
			console.group('Saving Tree Data')
			perfMetrics.lastSaveTime = performance.now()
			perfMetrics.saveOperations++
			console.log('Current Tree State:', lastStateRef.current)
		}

		setIsSaving(true)
		setLastSaveError(null)
		saveInProgressRef.current = true
		const currentData = lastStateRef.current

		try {
			// Collect all position updates into a single array
			const updates: {
				resourceId: string
				resourceOfId: string
				currentParentResourceId: string
				position: number
				metadata?: any
			}[] = []

			for (const [itemIndex, item] of currentData.entries()) {
				if (!item.itemData) {
					if (DEBUG) console.warn('Skipping item without itemData:', item)
					continue
				}

				if (item.children.length > 0) {
					if (DEBUG) console.group(`Processing children of ${item.id}`)

					for (const [childIndex, childItem] of item.children.entries()) {
						if (!childItem.itemData) {
							if (DEBUG)
								console.warn('Skipping child without itemData:', childItem)
							continue
						}

						if (DEBUG) {
							console.log('Queueing child position update:', {
								childId: childItem.id,
								parentId: item.itemData.resourceId,
								position: childIndex,
								currentParent: childItem.itemData.resourceOfId,
							})
						}

						updates.push({
							resourceId: childItem.itemData.resourceId,
							resourceOfId: item.itemData.resourceId,
							currentParentResourceId: childItem.itemData.resourceOfId,
							position: childIndex,
						})
					}
					if (DEBUG) console.groupEnd()
				}

				if (DEBUG) {
					console.log('Queueing root item position update:', {
						itemId: item.id,
						position: itemIndex,
						metadata: {
							...(item.itemData?.metadata || {}),
							tier: item.itemData?.metadata?.tier || 'standard',
						},
					})
				}

				updates.push({
					resourceId: item.itemData.resourceId,
					resourceOfId: rootResourceId,
					currentParentResourceId: item.itemData.resourceOfId,
					position: itemIndex,
					metadata: {
						...(item.itemData?.metadata || {}),
						tier: item.itemData?.metadata?.tier || 'standard',
					},
				})
			}

			// Execute single batch update
			if (DEBUG)
				console.log(`Executing batch update for ${updates.length} items`)
			await batchUpdateResourcePositions(updates)

			if (DEBUG) {
				perfMetrics.saveDuration = performance.now() - perfMetrics.lastSaveTime
				console.log(
					'Save completed in',
					perfMetrics.saveDuration.toFixed(2),
					'ms',
				)
				console.groupEnd()
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during save'
			setLastSaveError(errorMessage)
			if (DEBUG) {
				console.error('Save failed:', errorMessage)
				console.groupEnd()
			}
		} finally {
			setIsSaving(false)
			saveInProgressRef.current = false
		}
	}, [rootResourceId])

	// Debounce the save operation
	const debouncedSaveTreeData = useMemo(
		() => debounce(saveTreeData, 500),
		[saveTreeData],
	)

	useEffect(() => {
		if (lastAction === null) {
			return
		}

		// Use the debounced save for instruction-type actions
		if (lastAction.type === 'instruction') {
			debouncedSaveTreeData()
		} else {
			// For other actions like modal-move, save immediately
			saveTreeData()
		}

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

			actionMenuTrigger?.focus()
			return
		}

		if (lastAction.type === 'instruction') {
			const { element } = registry.get(lastAction.itemId) ?? {}
			if (element) {
				triggerPostMoveFlash(element)
			}
		}
	}, [lastAction, registry, saveTreeData, debouncedSaveTreeData])

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
			onRefresh,
			onResourceUpdate,
		}),
		[
			getChildrenOfItem,
			getMoveTargets,
			registerTreeItem,
			updateState,
			rootResourceId,
			rootResource,
			onRefresh,
			onResourceUpdate,
		],
	)

	useEffect(() => {
		invariant(ref.current)
		return combine(
			monitorForElements({
				canMonitor: ({ source }) =>
					source.data.uniqueContextId === context.uniqueContextId,
				async onDrop(args) {
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

	const [isRenameSectionModalOpen, setIsRenameSectionModalOpen] =
		useState(false)

	return (
		<TreeContext.Provider value={context}>
			<div ref={ref}>
				{DEBUG && (
					<div className="mb-2 rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300">
						<div>Active Items: {registry.size}</div>
						<div>Last Action: {lastAction?.type || 'none'}</div>
						<div>
							Performance: {perfMetrics.averageDragDuration.toFixed(2)}ms avg
						</div>
						<div className="mt-1 border-t border-neutral-200 pt-1 dark:border-neutral-700">
							<div>Save Operations: {perfMetrics.saveOperations}</div>
							<div>Last Save: {perfMetrics.saveDuration.toFixed(2)}ms</div>
							{isSaving && (
								<div className="text-blue-600 dark:text-blue-400">
									Saving...
								</div>
							)}
							{lastSaveError && (
								<div className="text-red-600 dark:text-red-400">
									Error: {lastSaveError}
								</div>
							)}
						</div>
					</div>
				)}
				<ResourceList
					resources={state.data}
					onRemove={(id) => updateState({ type: 'remove-item', itemId: id })}
					itemRenderer={(item, index) => {
						let type: ItemMode = 'standard'
						switch (true) {
							case item.children.length && item.isOpen:
								type = 'expanded'
								break
							case index === state.data.length - 1:
								type = 'last-in-group'
								break
						}
						return (
							<div className="relative border-b transition-colors">
								<TreeItem
									DEBUG={DEBUG}
									refresh={onRefresh}
									item={item}
									level={0}
									key={item.id}
									mode={type}
									index={index}
									showTierSelector={showTierSelector}
								/>
							</div>
						)
					}}
				/>
			</div>
		</TreeContext.Provider>
	)
}
