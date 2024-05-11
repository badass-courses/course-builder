import { componentName, getComponent, inflateToComponent } from '../components'
import { hasHook, triggerHook } from '../hooks'
import {
	Bus as IBus,
	Node as INode,
	ObserverFunc,
	RawNode,
	WalkFunc,
	WalkOptions,
} from '../mod'
import { Node } from './mod'

type CHANGE_ME = any

export class Bus implements IBus {
	nodes: Record<string, RawNode>
	observers: ObserverFunc[]

	constructor() {
		this.nodes = {
			'@root': {
				ID: '@root',
				Name: '@root',
				Linked: { Children: [], Components: [] },
				Attrs: {},
			},
		}
		this.observers = []
	}

	changed(n: INode) {
		this.observers.forEach((cb) => cb(n))
	}

	/* Bus interface */

	import(nodes: RawNode[]) {
		for (const n of nodes) {
			if (n.Value && getComponent(n.Name)) {
				n.Value = inflateToComponent(n.Name, n.Value)
				n.Rel = 'Components' // kludge
			}
			this.nodes[n.ID] = n
		}
		for (const n of nodes) {
			// clear stored tmp nodes
			if (n.Parent === '@tmp') {
				delete this.nodes[n.ID]
				continue
			}
			// clear nodes with no parent that aren't system
			if (!n.ID.startsWith('@') && n.Parent === undefined) {
				delete this.nodes[n.ID]
				continue
			}
			// clear nodes with non-existant parent
			if (n.Parent && !this.nodes[n.Parent]) {
				delete this.nodes[n.ID]
				continue
			}
			const node = this.find(n.ID)
			if (node) {
				// check orphan
				if (node.parent && !node.parent.raw) {
					delete this.nodes[n.ID]
					continue
				}
				// trigger attach
				triggerHook(node, 'onAttach', node)
			}
		}
	}

	export(): RawNode[] {
		const nodes: RawNode[] = []
		for (const n of Object.values(this.nodes)) {
			nodes.push(n)
		}
		return nodes
	}

	make(name: string, value?: any): INode {
		let parent: INode | null = null
		if (name.includes('/')) {
			const parts = name.split('/')

			parent = this.find(parts[0])
			console.log(
				`Found parent node for part[0]: ${parts[0]}, parent: ${parent ? parent.id : 'null'}`,
			)

			for (let i = 1; i < parts.length - 1; i++) {
				if (parent === null) {
					throw new Error('Unable to get root')
				}

				let child = parent.find(parts[i])
				console.log(
					`Looking for child: ${parts[i]}, found: ${child ? child.id : 'null'}`,
				)

				if (!child) {
					console.log(
						`Child not found, creating new node with name: ${parts.slice(0, i + 1).join('/')}`,
					)
					child = this.make(parts.slice(0, i + 1).join('/'))
				}
				parent = child
			}
			name = parts[parts.length - 1] || 'BROKEN'
			console.log(`Final name for node: ${name}`)
		}

		const id = name.startsWith('@') ? name : uniqueId()
		console.log(`Generated ID for node: ${id}`)

		this.nodes[id] = {
			ID: id,
			Name: name,
			Value: value,
			Linked: { Children: [], Components: [] },
			Attrs: {},
		}

		const node = new Node(this, id)
		console.log(`New node created with ID: ${id}`)

		if (parent) {
			node.parent = parent
			console.log(`Set parent of node ${id} to ${parent.id}`)
		}

		return node
	}
	// destroys node but not linked nodes
	destroy(n: INode) {
		const p = n.parent
		if (p !== null && !p.isDestroyed) {
			let rel = n.raw.Rel || 'Children'
			if (p.raw.Linked[rel]?.includes(n.id)) {
				p.raw.Linked[rel]?.splice(n.siblingIndex, 1)
			}
		}
		delete this.nodes[n.id]
		if (p) {
			this.changed(p)
		}
	}

	roots(): INode[] {
		return Object.values(this.nodes)
			.filter((n) => n.Parent === undefined)
			.map((n) => new Node(this, n.ID))
	}

	root(name?: string): INode {
		console.log(`root() called with name: ${name}`)
		name = name || '@root'
		const node = this.roots().find((root) => root.name === name)
		if (node === undefined) throw new Error(`unable to find root ${name}`)
		return node
	}

	find(path?: string): INode | null {
		if (!path) return null
		console.log(`find() called with path: ${path}`)
		const byId = this.nodes[path]
		console.log(`Found node by ID: ${byId ? byId.ID : 'null'}`)
		if (byId) return new Node(this, byId.ID)
		const parts = path.split('/')
		if (parts.length === 1 && parts[0]?.startsWith('@')) {
			// did not find @id by ID so return null
			console.log(`Path length is 1 and starts with '@', returning null`)
			return null
		}
		let cur

		try {
			cur = this.root(parts[0])
		} catch (e) {}

		if (!cur && this.nodes && this.nodes[parts[0] as CHANGE_ME]) {
			const idx: CHANGE_ME = parts[0]
			cur = new Node(this, this.nodes[idx]?.ID || 'BROKEN')
			console.log(`Found node by ID: ${cur ? cur.id : 'null'}`)
		}
		if (cur) {
			parts.shift()
		} else {
			cur = this.root('@root')
		}
		if (!cur) {
			console.log(`Root not found, returning null`)
			return null
		}
		const findChild = (n: INode, name: string): INode | undefined => {
			if (n.refTo) {
				n = n.refTo
			}
			return n.children.find((child) => child.name === name)
		}
		for (const name of parts) {
			const child = findChild(cur, name)
			if (!child) return null
			cur = child
			console.log(`Found child node with name: ${name}`)
		}
		return cur
	}

	walk(fn: WalkFunc, opts?: WalkOptions) {
		for (const root of this.roots()) {
			if (root.walk(fn, opts)) return
		}
	}

	observe(fn: ObserverFunc) {
		this.observers.push(fn)
	}
}

const uniqueId = () => {
	const dateString = Date.now().toString(36)
	const randomness = Math.random().toString(36).substring(2)
	return dateString + randomness
}
