import { useTreehouseStore } from '@/treehouse/mod'
import { SHA1 } from '@/treehouse/workbench/util'

import { componentName, duplicate, getComponent } from '../components'
import { hasHook, triggerHook } from '../hooks'
import { Bus as IBus, Node as INode, RawNode, WalkFunc, WalkOptions } from '../mod'
import { Bus } from './mod'

export class Node implements INode {
  _id: string
  _bus: Bus
  _hash: string

  constructor(bus: Bus, id: string) {
    this._bus = bus
    this._id = id
    this._hash = SHA1(JSON.stringify(this))
  }

  [Symbol.for('Deno.customInspect')]() {
    return `Node[${this.id}:${this.name}]`
  }

  /* Node interface */

  get id(): string {
    return this._id
  }

  get bus(): IBus {
    return this._bus
  }

  get hash(): string {
    return this._hash
  }

  get raw(): RawNode {
    const raw = this._bus.nodes[this.id]
    if (!raw) throw `use of non-existent node ${this.id}`
    return raw
  }

  get name(): string {
    if (this.refTo) {
      return this.refTo.name
    }
    return this.raw.Name
  }

  set name(val: string) {
    if (this.refTo) {
      this.refTo.name = val
    } else {
      this.raw.Name = val
    }
    this.changed()
  }

  get value(): any {
    if (this.refTo) {
      return this.refTo.value
    }
    return this.raw.Value
  }

  set value(val: string) {
    if (this.refTo) {
      this.refTo.value = val
    } else {
      this.raw.Value = val
    }
    this.changed()
  }

  get parent(): INode | null {
    if (!this.raw.Parent) return null
    if (!this._bus.nodes[this.raw.Parent]) return null
    return new Node(this._bus, this.raw.Parent)
  }

  set parent(n: INode | null) {
    const p = this.parent
    if (p !== null) {
      p.raw.Linked.Children?.splice(this.siblingIndex, 1)
    }
    if (n !== null) {
      this.raw.Parent = n.id
      n.raw.Linked.Children?.push(this.id)
      triggerHook(n, 'onAttach', n)
    } else {
      this.raw.Parent = undefined
    }
    this.changed()
  }

  get refTo(): INode | null {
    const id = this.raw.Attrs['refTo']
    if (!id) return null
    const refTo = this._bus.nodes[id]
    if (!refTo) return null
    return new Node(this._bus, id)
  }

  set refTo(n: INode | null) {
    if (!n) {
      delete this.raw.Attrs['refTo']
      this.changed()
      return
    }
    this.raw.Attrs['refTo'] = n.id
    this.changed()
  }

  get siblingIndex(): number {
    const p = this.parent
    if (p === null) return 0
    let rel = this.raw.Rel || 'Children'
    return p.raw.Linked[rel]?.findIndex((id) => id === this.id) || 0
  }

  set siblingIndex(i: number) {
    const p = this.parent
    if (p === null) return
    let rel = this.raw.Rel || 'Children'
    p.raw.Linked[rel]?.splice(this.siblingIndex, 1)
    p.raw.Linked[rel]?.splice(i, 0, this.id)
    p.changed()
  }

  get prevSibling(): INode | null {
    const p = this.parent
    if (p === null) return null
    if (this.siblingIndex === 0) return null
    let rel = this.raw.Rel || 'Children'
    return p.getLinked(rel)[this.siblingIndex - 1] || null
  }

  get nextSibling(): INode | null {
    const p = this.parent
    if (p === null) return null
    if (this.siblingIndex === p.children.length - 1) return null
    let rel = this.raw.Rel || 'Children'
    return p.getLinked(rel)[this.siblingIndex + 1] || null
  }

  get ancestors(): INode[] {
    const anc = []
    let p = this.parent
    while (p !== null) {
      anc.push(p)
      p = p.parent
    }
    return anc
  }

  get isDestroyed(): boolean {
    return !this._bus.nodes.hasOwnProperty(this.id)
  }

  get path(): string {
    let cur: INode | null = this
    const path = []
    while (cur) {
      path.unshift(cur.name)
      cur = cur.parent
    }
    return path.join('/')
  }

  get children(): INode[] {
    if (this.refTo) return this.refTo.children
    let children: INode[] = []
    if (this.raw.Linked.Children) {
      children = this.raw.Linked.Children.map((id) => new Node(this._bus, id))
    }
    for (const com of this.components) {
      if (hasHook(com, 'objectChildren')) {
        return triggerHook(com, 'objectChildren', this, children)
      }
    }
    return children
  }

  get childCount(): number {
    if (this.refTo) return this.refTo.childCount
    for (const com of this.components) {
      if (hasHook(com, 'objectChildren')) {
        return triggerHook(com, 'objectChildren', this, null).length
      }
    }
    if (!this.raw.Linked.Children) return 0
    return this.raw.Linked.Children.length
  }

  addChild(node: INode) {
    if (this.refTo) {
      this.refTo.addChild(node)
      return
    }
    this.raw.Linked.Children?.push(node.id)
    this.changed()
  }

  removeChild(node: INode) {
    if (this.refTo) {
      this.refTo.removeChild(node)
      return
    }
    const children = this.raw.Linked.Children?.filter((id) => id === node.id) || []
    this.raw.Linked.Children = children
    this.changed()
  }

  get fields(): INode[] {
    if (!this.raw.Linked.Fields) return []
    return this.raw.Linked.Fields.map((id) => new Node(this._bus, id))
  }

  get fieldCount(): number {
    if (!this.raw.Linked.Fields) return 0
    return this.raw.Linked.Fields.length
  }

  get components(): INode[] {
    if (!this.raw.Linked.Components) return []
    return this.raw.Linked.Components.map((id) => new Node(this._bus, id))
  }

  get componentCount(): number {
    if (!this.raw.Linked.Components) return 0
    return this.raw.Linked.Components.length
  }

  addComponent(obj: any) {
    const node = this.bus.make(componentName(obj), obj)
    node.raw.Parent = this.id
    node.raw.Rel = 'Components' // kludge
    this.raw.Linked.Components?.push(node.id)
    triggerHook(node, 'onAttach', node)
    this.changed()
  }

  removeComponent(obj: any) {
    let coms
    if (obj.name && getComponent(obj)) {
      coms = this.components.filter((n) => n.name === componentName(obj))
    } else {
      coms = this.components.filter((n) => n.value === obj)
    }
    if (coms.length > 0) {
      coms[0]?.destroy()
    }
    this.changed()
  }

  hasComponent(type: any): boolean {
    const coms = this.components.filter((n) => n.name === componentName(type))
    if (coms.length > 0) {
      return true
    }
    return false
  }

  getComponent(type: any): any | null {
    const coms = this.components.filter((n) => n.name === componentName(type))
    if (coms.length > 0) {
      return coms[0]?.value
    }
    return null
  }
  // getComponentsInChildren
  // getComponentsInParents

  getLinked(rel: string): INode[] {
    if (!this.raw.Linked[rel]) return []
    return this.raw.Linked[rel]?.map((id) => new Node(this._bus, id)) || []
  }

  addLinked(rel: string, node: INode) {
    if (!this.raw.Linked[rel]) {
      this.raw.Linked[rel] = []
    }
    node.raw.Rel = rel // kludge
    this.raw.Linked[rel]?.push(node.id)
    this.changed()
  }

  removeLinked(rel: string, node: INode) {
    if (!this.raw.Linked[rel]) {
      this.raw.Linked[rel] = []
    }
    const linked = this.raw.Linked[rel]?.filter((id) => id === node.id) || []
    this.raw.Linked[rel] = linked
    this.changed()
  }

  moveLinked(rel: string, node: INode, idx: number) {
    if (!this.raw.Linked[rel]) {
      this.raw.Linked[rel] = []
    }
    const oldIdx = this.raw.Linked[rel]?.findIndex((id) => id === node.id) || -1
    if (oldIdx === -1) return
    const linked = this.raw.Linked[rel] || []
    linked?.splice(idx, 0, linked.splice(oldIdx, 1)[0] || '')
    this.raw.Linked[rel] = linked
    this.changed()
  }

  getAttr(name: string): string {
    return this.raw.Attrs[name] || ''
  }

  setAttr(name: string, value: string) {
    this.raw.Attrs[name] = value
    this.changed()
  }

  find(path: string): INode | null {
    return this.bus.find([this.path, path].join('/'))
  }

  walk(fn: WalkFunc, opts?: WalkOptions): boolean {
    opts = opts || {
      followRefs: false,
      includeComponents: false,
    }
    if (fn(this)) {
      return true
    }
    let children = this.children
    if (this.refTo && opts.followRefs) {
      if (fn(this.refTo)) {
        return true
      }
      children = this.refTo.children
    }
    for (const child of children) {
      if (child.walk(fn, opts)) return true
    }
    if (opts.includeComponents) {
      for (const com of this.components) {
        if (com.walk(fn, opts)) return true
      }
    }
    return false
  }

  destroy() {
    if (this.isDestroyed) return
    if (this.refTo) {
      this._bus.destroy(this)
      return
    }
    const nodes: INode[] = []
    this.walk(
      (n: INode): boolean => {
        nodes.push(n)
        return false
      },
      {
        followRefs: false,
        includeComponents: true,
      },
    )
    nodes.reverse().forEach((n) => this._bus.destroy(n))
  }

  duplicate(): INode {
    const n = this._bus.make(this.name, duplicate(this.value))
    n.raw.Rel = this.raw.Rel
    this.fields
      .map((f) => f.duplicate())
      .forEach((f) => {
        n.addLinked('Fields', f)
        f.raw.Parent = n.raw.ID
      })
    this.components
      .map((c) => c.duplicate())
      .forEach((c) => {
        n.addLinked('Components', c)
        c.raw.Parent = n.raw.ID
      })
    this.children
      .map((c) => c.duplicate())
      .forEach((c) => {
        n.addChild(c)
        c.raw.Parent = n.raw.ID
      })
    return n
  }

  changed() {
    this._bus.changed(this)
    this._hash = SHA1(JSON.stringify(this))
  }

  displayName(node: Node): string {
    return node.name
  }
  // duplicate?
}
