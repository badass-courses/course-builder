import { Path } from '@/treehouse/workbench/path'
import { Workbench } from '@/treehouse/workbench/workbench'
import { create, StateCreator } from 'zustand'

import { FileStore } from '../backend/mod'
import { Bus, Node, RawNode } from '../model/mod'
import * as module from '../model/module/mod'

export interface Workspace {
	initializeWorkspace(fs: FileStore): Promise<void>
	fs?: FileStore
	bus?: Bus
	lastOpenedID: string | null
	expanded: { [key: string]: { [key: string]: boolean } }
	settings: { theme: string }
	writeDebounce: (path: string, contents: any) => void
	rawNodes: () => RawNode[]

	observe(fn: (n: Node) => void): void

	save(immediate?: boolean): Promise<void>

	load(): Promise<void>
	newWorkspace(name: string, value?: any): Node

	mainNode(): Node

	setExpanded(head: Node, n: Node, b: boolean): void
	getExpanded(head: Node, n: Node | null): boolean

	find(path: string): Node | null
	findAbove(path: Path): Path | null
	findBelow(path: Path): Path | null
}

/**
 * Workspace is a container for nodes and manages marshaling them using
 * the FileStore backend API. It also keeps track of what nodes have been
 * expanded and what node was last opened. It serializes as JSON with a
 * version indicator and will handle migrations of old versions to the
 * latest when loading. Saving is currently debounced here so this applies
 * to all backends.
 *
 * TODO: don't use file store because we are serverless
 * TODO: this could uses tests
 */
export const createWorkspaceSlice: StateCreator<
	Workbench & Workspace,
	[],
	[],
	Workspace
> = (set, get) => ({
	initializeWorkspace: async (fs: FileStore) => {
		set({ fs, bus: new module.Bus() })
	},
	fs: undefined,
	bus: undefined,
	lastOpenedID: null,
	expanded: {},
	settings: { theme: 'light' },
	writeDebounce: debounce(async (path: string, contents: any) => {
		try {
			const fs = get().fs
			if (!fs) throw new Error('FileStore not initialized')
			await fs.writeFile(path, contents)
			console.log('Saved workspace.')
		} catch (e: unknown) {
			console.error(e)
			document.dispatchEvent(new CustomEvent('BackendError'))
		}
	}, 300),
	rawNodes: () => {
		const state = get()
		return state.bus?.export() || []
	},
	observe(fn) {
		get().bus?.observe(fn)
	},
	async save(immediate = false) {
		const state = get()
		console.log('Saving workspace...', { state })
		const contents = JSON.stringify(
			{
				version: 1,
				lastopen: state.lastOpenedID,
				expanded: state.expanded,
				nodes: state.rawNodes(),
				settings: state.settings,
			},
			null,
			2,
		)
		if (immediate) {
			await state.fs?.writeFile('workspace.json', contents)
		} else {
			state.writeDebounce('workspace.json', contents)
		}
	},
	async load() {
		const state = get()
		let doc = JSON.parse((await state.fs?.readFile('workspace.json')) || '{}')
		if (doc.nodes) {
			doc.nodes = doc.nodes.map((n: any) => {
				if (n.Name === 'treehouse.SearchNode') {
					n.Name = 'treehouse.SmartNode'
				}
				return n
			})
			state.bus?.import(doc.nodes)
			console.log(`Loaded ${doc.nodes.length} nodes.`)
		}
		if (doc.expanded) {
			for (const n in doc.expanded) {
				for (const i in doc.expanded[n]) {
					if (state.bus?.find(i)) {
						const localExpanded = state.expanded[n] || {}
						localExpanded[i] = doc.expanded[n][i]
						set({ expanded: { ...state.expanded, [n]: localExpanded } })
					}
				}
			}
		}

		if (doc.lastopen) {
			set({ lastOpenedID: doc.lastopen })
		}
		if (doc.settings) {
			set({ settings: { ...state.settings, ...doc.settings } })
		}
	},
	mainNode() {
		const state = get()
		let main = state.bus?.find('@workspace')

		if (!main) {
			console.info('Building missing workspace node.')
			const root = state.bus?.find('@root')
			const ws = state.bus?.make('@workspace')
			if (!ws) throw new Error('Workspace not created')

			ws.name = 'Workspace'

			if (!root) throw new Error('Root not found')
			ws.parent = root
			const cal = state.bus?.make('@calendar')
			if (!cal) throw new Error('Calendar not created')
			cal.name = 'Calendar'
			cal.parent = ws
			const home = state.bus?.make('Home')
			if (!home) throw new Error('Home not created')
			home.parent = ws
			main = ws
		}
		return main
	},
	find(path) {
		return get().bus?.find(path) || null
	},
	newWorkspace(name: string, value?: any) {
		const state = get()
		if (!state.bus) throw new Error('Bus not initialized')
		return state.bus.make(name, value)
	},
	getExpanded(head: Node, n: Node) {
		if (!head || !n) return false
		const expanded = get().expanded[head.id] || {}
		return expanded[n.id] ?? false
	},
	setExpanded(head: Node, n: Node, b: boolean) {
		const state = get()
		const localExpanded = state.expanded[head.id] || {}
		localExpanded[n.id] = b
		set({ expanded: { ...state.expanded, [head.id]: localExpanded } })
		state.save()
	},
	findAbove(path: Path): Path | null {
		if (
			!path.head ||
			!path.node ||
			(path.node && path.head && path.node.id === path.head.id)
		) {
			return null
		}
		const p = path.clone()
		p.pop() // pop to parent
		let prev = path.node.prevSibling
		if (!prev) {
			// if not a field and parent has fields, return last field
			const fieldCount = path.previous?.getLinked('Fields').length || 0
			if (path.node.raw.Rel !== 'Fields' && fieldCount > 0) {
				return p.append(
					path.previous?.getLinked('Fields')[fieldCount - 1] as Node,
				)
			}
			// if no prev sibling, and no fields, return parent
			return p
		}
		const lastSubIfExpanded = (p: Path): Path => {
			if (!path.head || !path.node) {
				return p
			}
			const expanded = this.getExpanded(path.head, p.node as Node)
			if (!expanded) {
				// if not expanded, return input path
				return p
			}
			const fieldCount = p.node?.getLinked('Fields').length || 0
			if (p.node?.childCount === 0 && fieldCount > 0) {
				const lastField = p.node.getLinked('Fields')[fieldCount - 1]
				// if expanded, no children, has fields, return last field or its last sub if expanded
				return lastSubIfExpanded(p.append(lastField as Node))
			}
			if (p.node?.childCount === 0) {
				// expanded, no fields, no children
				return p
			}
			const lastChild = p.node?.children[p.node.childCount - 1]
			// return last child or its last sub if expanded
			return lastSubIfExpanded(p.append(lastChild as Node))
		}
		// return prev sibling or its last child if expanded
		return lastSubIfExpanded(p.append(prev))
	},

	findBelow(path: Path): Path | null {
		// TODO: find a way to indicate pseudo "new" node for expanded leaf nodes
		const p = path.clone()
		if (
			path.head &&
			path.node &&
			this.getExpanded(path.head, path.node) &&
			path.node.getLinked('Fields').length > 0
		) {
			// if expanded and fields, return first field
			return p.append(path.node.getLinked('Fields')[0] as Node)
		}
		if (
			(this.getExpanded(path.head as Node, path.node as Node) &&
				path.node?.childCount) ||
			0 > 0
		) {
			// if expanded and children, return first child
			return p.append(path.node?.children[0] as Node)
		}
		const nextSiblingOrParentNextSibling = (p: Path): Path | null => {
			const next = p.node?.nextSibling
			if (next) {
				p.pop() // pop to parent
				// if next sibling, return that
				return p.append(next)
			}
			const parent = p.previous
			if (!parent) {
				// if no parent, return null
				return null
			}
			if (p.node?.raw.Rel === 'Fields' && parent.childCount > 0) {
				p.pop() // pop to parent
				// if field and parent has children, return first child
				return p.append(parent.children[0] as Node)
			}
			p.pop() // pop to parent
			// return parents next sibling or parents parents next sibling
			return nextSiblingOrParentNextSibling(p)
		}
		// return next sibling or parents next sibling
		return nextSiblingOrParentNextSibling(p)
	},
})

function debounce(func: any, timeout = 3000) {
	let timer: any
	return (...args: any[]) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			// @ts-expect-error
			func.apply(this, args)
		}, timeout)
	}
}
