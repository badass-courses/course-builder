import {
  Fragment,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import invariant from 'tiny-invariant'

import FocusRing from '@atlaskit/focus-ring'
import ChevronDownIcon from '@atlaskit/icon/glyph/chevron-down'
import ChevronRightIcon from '@atlaskit/icon/glyph/chevron-right'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element'
import type {DragLocationHistory} from '@atlaskit/pragmatic-drag-and-drop/types'
import {combine} from '@atlaskit/pragmatic-drag-and-drop/util/combine'
import {offsetFromPointer} from '@atlaskit/pragmatic-drag-and-drop/util/offset-from-pointer'
import {setCustomNativeDragPreview} from '@atlaskit/pragmatic-drag-and-drop/util/set-custom-native-drag-preview'
import {
  Instruction,
  ItemMode,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item'
import {token} from '@atlaskit/tokens'

import {TreeItem as TreeItemType} from '../../data/tree'

import {indentPerLevel} from './constants'
import {DependencyContext, TreeContext} from './tree-context'
import {createRoot} from 'react-dom/client'

const iconColor = token('color.icon', '#44546F')

function ChildIcon() {
  return (
    <svg aria-hidden={true} width={24} height={24} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={2} fill={iconColor} />
    </svg>
  )
}

function GroupIcon({isOpen}: {isOpen: boolean}) {
  const Icon = isOpen ? ChevronDownIcon : ChevronRightIcon
  return <Icon label="" primaryColor={iconColor} />
}

function Icon({item}: {item: TreeItemType}) {
  if (!item.children.length) {
    return <ChildIcon />
  }
  return <GroupIcon isOpen={item.isOpen ?? false} />
}

function Preview({item}: {item: TreeItemType}) {
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
}: {
  item: TreeItemType
  mode: ItemMode
  level: number
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [state, setState] = useState<
    'idle' | 'dragging' | 'preview' | 'parent-of-instruction'
  >('idle')
  const [instruction, setInstruction] = useState<Instruction | null>(null)
  const cancelExpandRef = useRef<(() => void) | null>(null)

  const {dispatch, uniqueContextId, getPathToItem} = useContext(TreeContext)
  const {DropIndicator, attachInstruction, extractInstruction} =
    useContext(DependencyContext)
  const toggleOpen = useCallback(() => {
    dispatch({type: 'toggle', itemId: item.id})
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
        }),
        onGenerateDragPreview: ({nativeSetDragImage}) => {
          setCustomNativeDragPreview({
            getOffset: offsetFromPointer({x: '16px', y: '8px'}),
            render: ({container}) => {
              const root = createRoot(container)
              root.render(<Preview item={item} />)
              return () => root.unmount()
            },
            nativeSetDragImage,
          })
        },
        onDragStart: ({source}) => {
          setState('dragging')
          // collapse open items during a drag
          if (source.data.isOpenOnDragStart) {
            dispatch({type: 'collapse', itemId: item.id})
          }
        },
        onDrop: ({source}) => {
          setState('idle')
          if (source.data.isOpenOnDragStart) {
            dispatch({type: 'expand', itemId: item.id})
          }
        },
      }),
      dropTargetForElements({
        element: buttonRef.current,
        getData: ({input, element}) => {
          const data = {id: item.id}

          return attachInstruction(data, {
            input,
            element,
            indentPerLevel,
            currentLevel: level,
            mode,
            block: item.type === 'lesson' ? ['make-child'] : [],
          })
        },
        canDrop: ({source}) =>
          source.data.type === 'tree-item' &&
          source.data.uniqueContextId === uniqueContextId,
        getIsSticky: () => true,
        onDrag: ({self, source}) => {
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
                fn: () => dispatch({type: 'expand', itemId: item.id}),
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
        canMonitor: ({source}) =>
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

  return (
    <Fragment>
      <div
        className={
          state === 'idle' ? `cursor-pointer rounded-s hover:bg-blue-100` : ''
        }
        style={{position: 'relative'}}
      >
        <FocusRing isInset>
          <button
            {...aria}
            className="relative m-0 w-full cursor-pointer rounded-s border-0 bg-transparent p-0"
            id={`tree-item-${item.id}`}
            onClick={toggleOpen}
            ref={buttonRef}
            type="button"
            style={{paddingLeft: level * indentPerLevel}}
          >
            <span
              className={`flex flex-row items-center rounded-s bg-transparent p-[var(--grid)] pr-40 ${
                state === 'dragging'
                  ? `opacity-40`
                  : state === 'parent-of-instruction'
                    ? `transparent`
                    : ``
              }`}
            >
              <Icon item={item} />
              <span className="m-0 text-neutral-500">
                {item.label ?? item.id}
              </span>
              <small className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-left">
                {item.type === 'lesson' ? <code>Lesson</code> : null}
                <code className="text- absolute bottom-0 right-[var(--grid)] text-xs">
                  ({mode})
                </code>
              </small>
            </span>
            {instruction ? <DropIndicator instruction={instruction} /> : null}
          </button>
        </FocusRing>
      </div>
      {item.children.length && item.isOpen ? (
        <div id={aria?.['aria-controls']}>
          {item.children.map((child, index, array) => {
            const childType: ItemMode = (() => {
              console.log('child', child)
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
                item={child}
                key={child.id}
                level={level + 1}
                mode={childType}
              />
            )
          })}
        </div>
      ) : null}
    </Fragment>
  )
})

export default TreeItem
