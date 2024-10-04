'use client'

import { useState } from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Node } from '@/treehouse/model/mod'
import { Panel as PanelComponent } from '@/treehouse/ui/panel'

export const TreehouseApp = () => {
	const [open, setOpen] = useState(true)
	const toggleSidebar = () => setOpen(!open)
	const bus = useTreehouseStore((state) => state.bus)
	const panels = useTreehouseStore((state) => state.panels)
	const Menu = useTreehouseStore((state) => state.menu)
	const closeMenu = useTreehouseStore((state) => state.closeMenu)

	console.log('TreehouseApp', { panels })

	return (
		<main
			className="treehouse workbench absolute inset-0 m-0 flex flex-row"
			style={{ overflow: 'none' }}
		>
			<div
				className="sidebar mt-5 flex flex-col"
				style={{ width: open ? '256px' : '52px' }}
			>
				<div className="sidebar-main grow">
					{open &&
						bus?.root().children.map((node) => {
							return (
								<>
									<NavNode
										key={node.id}
										node={node}
										expanded={true}
										level={0}
									/>
								</>
							)
						})}
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
			<div className="main mt-10 flex grow flex-col">
				<div className="panels relative flex grow flex-row overflow-hidden">
					{/* Main content including topbar, panels, mobile-nav */}
					{panels.map((path) => (
						<div key={path.id}>
							<PanelComponent path={path} />
						</div>
					))}
				</div>
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
						const rect =
							dialog?.getBoundingClientRect() ||
							(e.target as HTMLDialogElement).getBoundingClientRect()
						if (
							e.clientX < rect.left ||
							e.clientX > rect.right ||
							e.clientY < rect.top ||
							e.clientY > rect.bottom
						) {
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

const NavNode = ({
	node,
	expanded: initialExpanded,
	level,
}: {
	node: Node
	expanded: boolean
	level: number
}) => {
	const [expanded, setExpanded] = useState(initialExpanded)
	const expandable = node.childCount > 0 && level < 3
	const { open } = useTreehouseStore((state) => ({ open: state.open }))

	const toggle = (e: React.MouseEvent) => {
		if (!expandable) return
		setExpanded(!expanded)
		e.stopPropagation()
	}

	const openNode = (e: React.MouseEvent) => {
		const mobileNav = document.querySelector('.mobile-nav') as HTMLElement
		if (mobileNav?.offsetHeight) {
			;(document.querySelector('.sidebar') as HTMLElement).style.display =
				'none'
		}
		open(node)
	}

	return (
		<div>
			<div className="sidebar-item flex">
				<svg
					onClick={toggle}
					className="feather feather-chevron-right shrink-0"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					{expandable &&
						(expanded ? (
							<polyline points="6 9 12 15 18 9"></polyline>
						) : (
							<polyline points="9 18 15 12 9 6"></polyline>
						))}
				</svg>
				<div
					className="sidebar-item-label grow"
					onClick={openNode}
					style={{
						cursor: 'pointer',
						maxWidth: '100%',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{node.name}
				</div>
			</div>
			{expanded && (
				<div className="sidebar-item-nested">
					{node.children
						.filter((n) => n.name !== '')
						.map((n, index) => (
							<NavNode
								key={index}
								node={n}
								level={level + 1}
								expanded={false}
							/>
						))}
				</div>
			)}
		</div>
	)
}
