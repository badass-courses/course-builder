'use client'

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import memoizeOne from 'memoize-one'
import invariant from 'tiny-invariant'

import {monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/adapter/element'
import {combine} from '@atlaskit/pragmatic-drag-and-drop/util/combine'
import {triggerPostMoveFlash} from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash'
import {
  Instruction,
  ItemMode,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region'

import {
  getInitialTreeState,
  tree,
  TreeItem as TreeItemType,
  treeStateReducer,
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
    {element: HTMLElement; actionMenuTrigger: HTMLElement}
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
    registry.set(itemId, {element, actionMenuTrigger})
    return () => {
      registry.delete(itemId)
    }
  }

  return {registry, registerTreeItem}
}

export default function Tree({initialData}: {initialData?: TreeItemType[]}) {
  const [state, updateState] = useReducer(
    treeStateReducer,
    initialData,
    getInitialTreeState,
  )

  const ref = useRef<HTMLDivElement>(null)
  const {extractInstruction} = useContext(DependencyContext)

  const [{registry, registerTreeItem}] = useState(createTreeItemRegistry)

  const {data, lastAction} = state
  let lastStateRef = useRef<TreeItemType[]>(data)
  useEffect(() => {
    lastStateRef.current = data
  }, [data])

  useEffect(() => {
    if (lastAction === null) {
      return
    }

    if (lastAction.type === 'modal-move') {
      const parentName =
        lastAction.targetId === '' ? 'the root' : `Item ${lastAction.targetId}`

      liveRegion.announce(
        `You've moved Item ${lastAction.itemId} to position ${
          lastAction.index + 1
        } in ${parentName}.`,
      )

      const {element, actionMenuTrigger} = registry.get(lastAction.itemId) ?? {}
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
      const {element} = registry.get(lastAction.itemId) ?? {}
      if (element) {
        triggerPostMoveFlash(element)
      }

      return
    }
  }, [lastAction, registry])

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
  const getMoveTargets = useCallback(({itemId}: {itemId: string}) => {
    const data = lastStateRef.current

    const targets = []

    console.log('getMoveTargets', itemId, data)
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

    console.log(targets)

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
          tree.getPathToItem({current: lastStateRef.current, targetId}) ?? [],
      ),
      getMoveTargets,
      getChildrenOfItem,
      registerTreeItem,
    }),
    [getChildrenOfItem, getMoveTargets, registerTreeItem],
  )

  useEffect(() => {
    invariant(ref.current)
    return combine(
      monitorForElements({
        canMonitor: ({source}) =>
          source.data.uniqueContextId === context.uniqueContextId,
        onDrop(args) {
          const {location, source} = args
          // didn't drop on anything
          console.log('onDrop', args)
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
  }, [context, extractInstruction])

  return (
    <TreeContext.Provider value={context}>
      <div style={{display: 'flex', justifyContent: 'center', padding: 24}}>
        <div
          className="w-px[280] box box-border flex flex-col p-8"
          id="tree"
          ref={ref}
        >
          {data.map((item, index, array) => {
            console.log('TOP item', item)
            const type: ItemMode = (() => {
              if (item.children.length && item.isOpen) {
                return 'expanded'
              }

              if (index === array.length - 1) {
                return 'last-in-group'
              }

              return 'standard'
            })()

            return <TreeItem item={item} level={0} key={item.id} mode={type} />
          })}
        </div>
      </div>
    </TreeContext.Provider>
  )
}
