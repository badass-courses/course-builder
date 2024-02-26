'use client'

import { SyntheticEvent, useState } from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Node } from '@/treehouse/model/mod'
import { Panel as PanelComponent } from '@/treehouse/ui/panel'
import { Workbench } from '@/treehouse/workbench/workbench'

export const TreehouseApp = () => {
  const [open, setOpen] = useState(true)
  const toggleSidebar = () => setOpen(!open)
  const bus = useTreehouseStore((state) => state.bus)
  const panels = useTreehouseStore((state) => state.panels)
  const Menu = useTreehouseStore((state) => state.menu)
  const closeMenu = useTreehouseStore((state) => state.closeMenu)

  return (
    <main className="treehouse workbench absolute inset-0 m-0 flex flex-row" style={{ overflow: 'none' }}>
      <div className="sidebar flex flex-col" style={{ width: open ? '256px' : '52px' }}>
        <div className="sidebar-main grow">
          {open && bus?.root().children.map((node) => <NavNode key={node.id} node={node} expanded={true} level={0} />)}
        </div>
        <div className="sidebar-bottom">
          <svg
            onClick={toggleSidebar}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-sidebar"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </div>
      </div>
      <div className="main flex grow flex-col">
        ...
        {/* Main content including topbar, panels, mobile-nav */}
        {panels.map((path) => (
          <PanelComponent key={path.hash} path={path} />
        ))}
      </div>
      {Menu && (
        <dialog
          className="menu popover"
          style={{ margin: '0', ...(Menu && { ...Menu.props.style }) }}
          onCancel={(e) => {
            // resets body
            useTreehouseStore.setState({ menu: undefined })
          }}
          onClick={(e: React.MouseEvent<HTMLDialogElement>) => {
            const dialog = (e.target as HTMLDialogElement).closest('dialog')
            const rect = dialog?.getBoundingClientRect() || (e.target as HTMLDialogElement).getBoundingClientRect()
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
              closeMenu()
            }
          }}
        >
          {Menu}
        </dialog>
      )}
    </main>
  )
}

const NavNode = ({ node, expanded: propExpanded, level }: { node: Node; expanded: boolean; level: number }) => {
  const [expanded, setExpanded] = useState(propExpanded)
  const expandable = node.childCount > 0 && level < 3

  const toggleExpansion = (e: React.SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (expandable) {
      setExpanded(!expanded)
    }
  }

  const openNode = (e: React.SyntheticEvent<HTMLDivElement>) => {
    // Logic to handle node opening
  }

  return (
    <div>
      <div className="sidebar-item flex" onClick={expandable ? toggleExpansion : openNode}>
        {/* Node label and optional expand/collapse icon */}
      </div>
      {expanded && (
        <div className="sidebar-item-nested">
          {node.children
            .filter((n: Node) => n.name !== '')
            .map((n) => (
              <NavNode key={n.id} node={n} level={level + 1} expanded={true} />
            ))}
        </div>
      )}
    </div>
  )
}
