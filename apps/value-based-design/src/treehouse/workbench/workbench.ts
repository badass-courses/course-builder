// import { Tag } from "../com/tag";
import { FunctionComponent, SyntheticEvent } from 'react'
import * as React from 'react'
import { Settings } from '@/treehouse/ui/settings'
import { Path } from '@/treehouse/workbench/path'
import { create, StateCreator } from 'zustand'

import { Command, CommandRegistry } from '../action/commands'
import { KeyBindings } from '../action/keybinds'
import { MenuRegistry } from '../action/menus'
import { Backend } from '../backend/mod'
import { Node } from '../model/mod'
import { Menu } from '../ui/menu'
import {
	FirstTimeMessage,
	GitHubMessage,
	LockStolenMessage,
} from '../ui/notices'
import { CommandPalette } from '../ui/palette'
import { QuickAdd } from '../ui/quickadd'
import { Context } from './mod'
import { Workspace } from './workspace'

export interface Clipboard {
	op: 'cut' | 'copy' | 'copyref'
	node: Node
}

export interface Drawer {
	open: boolean
}

/**
 * Workbench is the top-level controller for the Treehouse frontend.
 *
 * It manages the user action registries, open panels, open workspace,
 * user context, and provides an API used by UI components to
 * trigger various pop-overs, work with quick add, or anything else
 * not provided by the backend or workspace.
 */
export const createWorkbenchSlice: StateCreator<
	Workbench & Workspace,
	[],
	[],
	Workbench
> = (set, get) => ({
	commands: new CommandRegistry(),
	keybindings: new KeyBindings(),
	menus: new MenuRegistry(),
	backend: undefined,
	context: { node: null, path: null },
	panels: [],
	clipboard: undefined,
	drawer: { open: false },
	popover: null,
	dialog: React.createElement('div', {}),
	menu: React.createElement('div', {}),

	mainPanel: () => {
		const { panels } = get()
		return panels[0] as Path
	},

	initializeWorkbench: async (backend: Backend) => {
		console.log('Initializing workbench with backend', backend)
		const {
			openNewPanel,
			initializeWorkspace,
			load,
			observe,
			save,
			find,
			mainNode,
		} = get()
		await initializeWorkspace(backend.files)

		await load()

		const rawNodes = get().rawNodes()

		rawNodes.forEach((n) => backend.index.index(n))
		observe((n) => {
			save()
			console.log('observed', n.id, n.raw)
			if (n.isDestroyed) {
				backend.index.remove(n.id)
			} else {
				backend.index.index(n.raw)
				n.components.forEach((com) => backend.index.index(com.raw))
			}
		})

		set({ backend })

		const lastOpenedID = get().lastOpenedID

		if (lastOpenedID) {
			openNewPanel(find(lastOpenedID) || mainNode())
		} else {
			console.log('No last opened ID, opening main node')
			openNewPanel(mainNode())
		}

		if (backend.loadExtensions) {
			await backend.loadExtensions()
		}
	},

	authenticated: () => {
		const { backend } = get()
		return Boolean(backend?.auth && backend.auth.currentUser()) || false
	},
	openQuickAdd: () => {
		const { showDialog, find, newWorkspace } = get()
		let node = find('@quickadd') || newWorkspace('@quickadd')

		showDialog(
			() => React.createElement(QuickAdd, { workbench: get(), node }),
			true,
		)
		setTimeout(() => {
			;(
				document.querySelector('main > dialog .new-node input') as HTMLElement
			)?.focus()
		}, 1)
	},
	commitQuickAdd: () => {
		const { todayNode, find } = get()
		const node = find('@quickadd')
		if (!node) return
		const today = todayNode()
		node.children.forEach((n) => (n.parent = today))
	},
	clearQuickAdd: () => {
		const { todayNode, find } = get()

		const node = find('@quickadd')
		if (!node) return
		node.children.forEach((n) => n.destroy())
	},
	todayNode: () => {
		const { find, newWorkspace } = get()

		const today = new Date()
		const dayNode = today.toUTCString().split(today.getFullYear().toString())[0]
		const weekNode = `Week ${String(getWeekOfYear(today)).padStart(2, '0')}`
		const yearNode = `${today.getFullYear()}`
		const todayPath = ['@calendar', yearNode, weekNode, dayNode].join('/')
		let todayNode = find(todayPath)
		if (!todayNode) {
			todayNode = newWorkspace(todayPath)
		}
		return todayNode
	},
	openToday: () => {
		const { open, todayNode } = get()
		open(todayNode())
	},
	open: async (n: Node) => {
		const { panels, expanded, save } = get()
		// TODO: not sure this is still necessary
		if (!expanded[n.id]) {
			set({ expanded: { ...expanded, [n.id]: {} } })
		}

		set({ lastOpenedID: n.id })
		await save()
		const p = new Path(n)
		console.log('opening panel', { panel: p })
		set({ panels: [...panels, p], context: { node: n, path: p } })
	},
	openNewPanel: async (n: Node) => {
		const { panels, expanded, save } = get()
		// TODO: not sure this is still necessary
		if (!expanded[n.id]) {
			set({ expanded: { ...expanded, [n.id]: {} } })
		}

		set({ lastOpenedID: n.id })
		await save()
		const p = new Path(n)
		console.log('opening new panel', { panel: p })
		set({ panels: [...panels, p], context: { node: n, path: p } })
	},
	closePanel: (panel: Path) => {
		const { panels } = get()
		set({ panels: panels.filter((p) => p.name !== panel.name) })
	},
	defocus: () => {
		const { context, getInput } = get()
		if (!context.path) return
		const input = getInput(context.path)
		if (input) {
			input.blur()
		}
		set({ context: { node: null, path: null } })
	},
	focus: (path: Path, pos: number = 0) => {
		const { context, getInput } = get()
		const input = getInput(path)

		console.log('focusing', { path, input, pos, context })

		if (input) {
			set({ context: { ...context, path } })
			input.focus()
			if (pos !== undefined) {
				input.setSelectionRange(pos, pos)
			}
		} else {
			console.warn('unable to find input for', path)
		}
	},
	getInput: (path: Path) => {
		// TODO does this DOM crawling work in React?
		let id = `input-${path.id}-${path.node.id}`
		// kludge:
		if (path.node.raw.Rel === 'Fields') {
			if (path.node.name !== '') {
				id = id + '-value'
			}
		}
		const el = document.getElementById(id)

		console.log('getting input', { id, el })
		// @ts-ignore
		if (el?.editor) {
			// @ts-ignore
			return el.editor
		}
		return el
	},
	canExecuteCommand: (id: string, ctx: any, ...rest: any) => {
		const { newContext, commands } = get()
		ctx = newContext(ctx)
		return commands.canExecuteCommand(id, ctx, ...rest)
	},
	executeCommand: (id: string, ctx: any, ...rest: any) => {
		const { newContext, commands } = get()
		ctx = newContext(ctx)
		return commands.executeCommand(id, ctx, ...rest)
	},
	newContext: (ctx: any) => {
		const { context } = get()
		set({ context: Object.assign({}, context, ctx) })
		return get().context
	},
	showMenu: (event: React.MouseEvent, ctx: Context, style?: any) => {
		console.log('showing menu', { event, ctx, style })
		const { context, menus, commands, menu } = get()
		event.stopPropagation()
		event.preventDefault()
		const currentTarget = event.target as HTMLElement
		const trigger = currentTarget.closest('*[data-menu]') as HTMLElement
		const rect = trigger?.getBoundingClientRect()
		// TODO: styling
		if (!style) {
			const align = trigger.dataset['align'] || 'left'
			style = {
				top: `${document.body.scrollTop + rect.y + rect.height}px`,
			}
			if (align === 'right') {
				style.marginLeft = 'auto'
				style.marginRight = `${document.body.offsetWidth - rect.right}px`
			} else {
				style.marginLeft = `${document.body.scrollLeft + rect.x}px`
				style.marginRight = 'auto'
			}
		}
		console.log('showing menu', { trigger, rect, style })
		if (!trigger.dataset['menu']) return

		const items = menus.menus[trigger.dataset['menu']] || []
		const cmds =
			items
				.filter((i) => i.command)
				.map((i) => commands.commands[i.command] as Command) || []
		if (!items) {
			return
		}

		set({ menu: React.createElement(Menu, { ctx, items, commands: cmds }) })

		// TODO: draw logic `look up flushSync`
		// m.redraw();
		setTimeout(() => {
			// this next frame timeout is so any current dialog can close before attempting
			// to showModal on already open dialog, which causes exception.
			;(
				document.querySelector('main > dialog.menu') as HTMLDialogElement
			)?.showModal()
		}, 0)
	},
	closeMenu: () => {
		;(
			document.querySelector('main > dialog.menu') as HTMLDialogElement
		)?.close()
	},
	showPalette: (x: number, y: number, ctx: Context) => {
		const { showDialog } = get()
		showDialog(
			() =>
				React.createElement(CommandPalette, {
					workbench: get() as Workbench,
					ctx,
				}),
			false,
			{
				left: `${x}px`,
				top: `${y}px`,
			},
		)
	},
	showNotice: (
		notice: 'firsttime' | 'github' | 'lockstolen',
		finished: any,
	) => {
		const { showDialog } = get()
		const NoticeComponent = {
			firsttime: FirstTimeMessage,
			github: GitHubMessage,
			lockstolen: LockStolenMessage,
		}[notice]

		showDialog(
			() =>
				React.createElement(NoticeComponent as FunctionComponent<any>, {
					workbench: this,
					finished,
				}),
			true,
			undefined,
			notice === 'lockstolen',
		)
	},
	toggleDrawer: () => {
		set((state) => ({ drawer: { open: !state.drawer.open } }))
	},
	showSettings: () => {
		const { showDialog } = get()
		showDialog(
			() => React.createElement(Settings, { workbench: get() as Workbench }),
			true,
		)
	},
	showPopover: (body: any, style?: {}) => {
		set({ popover: { body, style } })
	},
	closePopover: () => {
		set({ popover: null })
	},
	showDialog: (
		body: any,
		backdrop?: boolean,
		style?: {},
		explicitClose?: boolean,
	) => {
		const { dialog } = get()
		// TODO actual dialog element
		set({
			dialog: React.createElement('div', {
				body,
				backdrop,
				style,
				explicitClose,
			}),
		})

		// TODO redraw
		// m.redraw();
		setTimeout(() => {
			// this next frame timeout is so any current dialog can close before attempting
			// to showModal on already open dialog, which causes exception.
			;(
				document.querySelector('main > dialog.modal') as HTMLDialogElement
			)?.showModal()
		}, 0)
	},
	isDialogOpen: (): boolean => {
		return (
			document.querySelector('main > dialog.modal') as HTMLDialogElement
		)?.hasAttribute('open')
	},
	closeDialog: () => {
		;(
			document.querySelector('main > dialog.modal') as HTMLDialogElement
		)?.close()
	},
	search: (query: string): Node[] => {
		if (!query) return []
		const { backend } = get()
		// this regex selects spaces NOT inside quotes
		let splitQuery = query.split(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/)
		let textQuery = splitQuery.filter((term) => !term.includes(':')).join(' ')
		let fieldQuery = Object.fromEntries(
			splitQuery
				.filter((term) => term.includes(':'))
				.map((term) => term.toLowerCase().split(':')),
		)
		if (!textQuery && Object.keys(fieldQuery).length > 0) {
			// when text query is empty, no results will show up,
			// but we index field names, so this works for now.
			textQuery = Object.keys(fieldQuery)[0] || ''
		}
		const passFieldQuery = (node: Node): boolean => {
			// kludgy filter on fields
			if (Object.keys(fieldQuery).length > 0) {
				const fields = {}
				for (const f of node.getLinked('Fields')) {
					// @ts-ignore
					fields[(f.name as string).toLowerCase()] = f.value.toLowerCase()
				}
				for (const f in fieldQuery) {
					// @ts-ignore
					const field = fields[f.replace(/['"]/g, '')]
					if (!field || field !== fieldQuery[f].replace(/['"]/g, '')) {
						return false
					}
				}
			}
			return true
		}
		// simple, limited search for tag implementation
		// TODO fix tags
		// if (textQuery.startsWith("#")) {
		//   return Tag.findTagged(this.workspace, textQuery.replace("#", "")).filter(
		//     passFieldQuery,
		//   );
		// }
		let resultCache = {}
		backend?.index.search(textQuery).forEach((id) => {
			const { find } = get()
			// @ts-ignore
			let node: Node | null = find(id)

			if (!node) {
				return
			}
			// if component/field value, get the parent
			if (node.value) {
				node = node.parent
				// parent might not actually exist
				if (!node?.raw) return
			}
			if (!passFieldQuery(node)) {
				return
			}
			// @ts-ignore
			resultCache[node.id] = node
		})
		return Object.values(resultCache)
	},
})

export interface Workbench {
	commands: CommandRegistry
	keybindings: KeyBindings
	menus: MenuRegistry
	backend?: Backend
	context: Context
	panels: Path[]
	clipboard?: Clipboard
	drawer: Drawer
	mainPanel: () => Path
	popover: any // Specify the correct type if possible
	dialog: React.ReactElement // Specify the correct return type for body
	menu: React.ReactElement // Specify the correct return type for body
	initializeWorkbench: (backend: Backend) => Promise<void>
	authenticated: () => boolean
	openQuickAdd: () => void
	commitQuickAdd: () => void
	clearQuickAdd: () => void
	todayNode: () => Node
	openToday: () => void
	open: (n: Node) => void
	openNewPanel: (n: Node) => void
	closePanel: (panel: Path) => void
	defocus: () => void
	focus: (path: Path, pos?: number) => void
	getInput: (path: Path) => any
	canExecuteCommand: (id: string, ctx: any, ...rest: any) => boolean
	executeCommand: <T>(id: string, ctx: any, ...rest: any) => Promise<T>
	newContext: (ctx: any) => Context
	showMenu: (event: React.MouseEvent, ctx: Context, style?: {}) => void
	closeMenu: () => void
	showPalette: (x: number, y: number, ctx: Context) => void
	showNotice: (
		notice: 'firsttime' | 'github' | 'lockstolen',
		finished: any,
	) => void
	toggleDrawer: () => void
	showSettings: () => void
	showPopover: (body: any, style?: {}) => void
	closePopover: () => void
	showDialog: (
		body: any,
		backdrop?: boolean,
		style?: {},
		explicitClose?: boolean,
	) => void
	isDialogOpen: () => boolean
	closeDialog: () => void
	search: (query: string) => Node[]
}

function getWeekOfYear(date: Date) {
	var d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	)
	var dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	// @ts-ignore
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
