import { componentName, getComponent, inflateToComponent } from '../components'
import { hasHook, triggerHook } from '../hooks'
import { Bus as IBus, Node as INode, ObserverFunc, RawNode, WalkFunc, WalkOptions } from '../mod'
import { Node } from './mod'

type CHANGE_ME = any

export class Bus {
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
      parent = this.find(parts[0] as CHANGE_ME)
      for (let i = 1; i < parts.length - 1; i++) {
        if (parent === null) {
          throw 'unable to get root'
        }

        let child = parent.find(parts[i] as CHANGE_ME)
        if (!child) {
          child = this.make(parts.slice(0, i + 1).join('/'))
        }
        parent = child
      }
      name = parts[parts.length - 1] || 'BROKEN'
    }
    const id = name.startsWith('@') ? name : uniqueId()
    this.nodes[id] = {
      ID: id,
      Name: name,
      Value: value,
      Linked: { Children: [], Components: [] },
      Attrs: {},
    }
    const node = new Node(this, id)
    if (parent) {
      node.parent = parent
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

  root(name?: string): INode | null {
    name = name || '@root'
    const node = this.roots().find((root) => root.name === name)
    if (node === undefined) return null
    return node
  }

  find(path: string): INode | null {
    const byId = this.nodes[path]
    if (byId) return new Node(this, byId.ID)
    const parts = path.split('/')
    if (parts.length === 1 && parts[0]?.startsWith('@')) {
      // did not find @id by ID so return null
      return null
    }
    let cur = this.root(parts[0])
    if (!cur && this.nodes && this.nodes[parts[0] as CHANGE_ME]) {
      const idx: CHANGE_ME = parts[0]
      cur = new Node(this, this.nodes[idx]?.ID || 'BROKEN')
    }
    if (cur) {
      parts.shift()
    } else {
      cur = this.root('@root')
    }
    if (!cur) {
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
