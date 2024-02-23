// import { Tag } from "../com/tag";
import { FunctionComponent, SyntheticEvent } from 'react'
import * as React from 'react'
import { Settings } from '@/treehouse/ui/settings'
import { Path } from '@/treehouse/workbench/path'

import { Command, CommandRegistry } from '../action/commands'
import { KeyBindings } from '../action/keybinds'
import { MenuRegistry } from '../action/menus'
import { Backend } from '../backend/mod'
import { Node } from '../model/mod'
import { Menu } from '../ui/menu'
import { FirstTimeMessage, GitHubMessage, LockStolenMessage } from '../ui/notices'
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
export class Workbench {
  commands: CommandRegistry
  keybindings: KeyBindings
  menus: MenuRegistry

  backend: Backend
  workspace: Workspace

  context: Context
  panels: Path[]
  clipboard?: Clipboard
  drawer: Drawer

  popover: any
  dialog: any
  menu: any

  constructor(backend: Backend) {
    this.commands = new CommandRegistry()
    this.keybindings = new KeyBindings()
    this.menus = new MenuRegistry()

    this.backend = backend
    this.workspace = new Workspace(backend.files)

    this.context = { node: null, path: null }
    this.panels = []
    this.drawer = { open: false }

    this.dialog = { body: () => null }
    this.menu = { body: () => null }
  }

  get mainPanel(): Path {
    if (!this.panels[0]) {
      throw new Error('No main panel')
    }
    return this.panels[0] as Path
  }

  async initialize() {
    await this.workspace.load()

    this.workspace.rawNodes.forEach((n) => this.backend.index.index(n))
    this.workspace.observe((n) => {
      this.workspace.save()
      if (n.isDestroyed) {
        this.backend.index.remove(n.id)
      } else {
        this.backend.index.index(n.raw)
        n.components.forEach((com) => this.backend.index.index(com.raw))
      }
    })

    if (this.workspace.lastOpenedID) {
      this.openNewPanel(this.workspace.find(this.workspace.lastOpenedID) || this.workspace.mainNode())
    } else {
      this.openNewPanel(this.workspace.mainNode())
    }

    if (this.backend.loadExtensions) {
      await this.backend.loadExtensions()
    }

    if (this.workspace.settings.theme) {
      const css = document.createElement('link')
      // TODO: figure out better way to couple themes than hardcoded hotlinked URL
      css.setAttribute('href', `https://treehouse.sh/style/design.css`)
      css.setAttribute('rel', 'stylesheet')
      css.setAttribute('type', 'text/css')
      document.head.appendChild(css)
    }

    // TODO how do we handle redraws in React?
    // m.redraw();
  }

  authenticated(): boolean {
    return Boolean(this.backend.auth && this.backend.auth.currentUser()) || false
  }

  openQuickAdd() {
    let node = this.workspace.find('@quickadd') || this.workspace.new('@quickadd')

    this.showDialog(() => React.createElement(QuickAdd, { workbench: this, node }), true)
    setTimeout(() => {
      ;(document.querySelector('main > dialog .new-node input') as HTMLElement)?.focus()
    }, 1)
  }

  commitQuickAdd() {
    const node = this.workspace.find('@quickadd')
    if (!node) return
    const today = this.todayNode()
    node.children.forEach((n) => (n.parent = today))
  }

  clearQuickAdd() {
    const node = this.workspace.find('@quickadd')
    if (!node) return
    node.children.forEach((n) => n.destroy())
  }

  // TODO: goto workspace
  todayNode(): Node {
    const today = new Date()
    const dayNode = today.toUTCString().split(today.getFullYear().toString())[0]
    const weekNode = `Week ${String(getWeekOfYear(today)).padStart(2, '0')}`
    const yearNode = `${today.getFullYear()}`
    const todayPath = ['@calendar', yearNode, weekNode, dayNode].join('/')
    let todayNode = this.workspace.find(todayPath)
    if (!todayNode) {
      todayNode = this.workspace.new(todayPath)
    }
    return todayNode
  }

  openToday() {
    this.open(this.todayNode())
  }

  open(n: Node) {
    // TODO: not sure this is still necessary
    if (!this.workspace.expanded[n.id]) {
      this.workspace.expanded[n.id] = {}
    }

    this.workspace.lastOpenedID = n.id
    this.workspace.save()
    const p = new Path(n)
    this.panels[0] = p
    this.context.path = p
  }

  openNewPanel(n: Node) {
    // TODO: not sure this is still necessary
    if (!this.workspace.expanded[n.id]) {
      this.workspace.expanded[n.id] = {}
    }

    this.workspace.lastOpenedID = n.id
    this.workspace.save()
    const p = new Path(n)
    this.panels.push(p)
    this.context.path = p
  }

  closePanel(panel: Path) {
    this.panels = this.panels.filter((p) => p.name !== panel.name)
  }

  defocus() {
    if (!this.context.path) return
    const input = this.getInput(this.context.path)
    if (input) {
      input.blur()
    }
    this.context.node = null
    this.context.path = null
  }

  focus(path: Path, pos: number = 0) {
    const input = this.getInput(path)
    if (input) {
      this.context.path = path
      input.focus()
      if (pos !== undefined) {
        input.setSelectionRange(pos, pos)
      }
    } else {
      console.warn('unable to find input for', path)
    }
  }

  getInput(path: Path): any {
    let id = `input-${path.id}-${path.node.id}`
    // kludge:
    if (path.node.raw.Rel === 'Fields') {
      if (path.node.name !== '') {
        id = id + '-value'
      }
    }
    const el = document.getElementById(id)
    // @ts-ignore
    if (el?.editor) {
      // @ts-ignore
      return el.editor
    }
    return el
  }

  canExecuteCommand(id: string, ctx: any, ...rest: any): boolean {
    ctx = this.newContext(ctx)
    return this.commands.canExecuteCommand(id, ctx, ...rest)
  }

  executeCommand<T>(id: string, ctx: any, ...rest: any): Promise<T> {
    ctx = this.newContext(ctx)
    console.log(id, ctx, ...rest)
    return this.commands.executeCommand(id, ctx, ...rest)
  }

  newContext(ctx: any): Context {
    return Object.assign({}, this.context, ctx)
  }

  showMenu(event: React.MouseEvent, ctx: Context, style?: {}) {
    event.stopPropagation()
    event.preventDefault()
    const currentTarget = event.target as HTMLElement
    const trigger = currentTarget.closest('*[data-menu]') as HTMLElement
    const rect = trigger?.getBoundingClientRect()
    // TODO: styling
    // if (!style) {
    //   const align = trigger.dataset["align"] || "left";
    //   style = {
    //     top: `${document.body.scrollTop + rect.y + rect.height}px`,
    //   };
    //   if (align === "right") {
    //     style.marginLeft = "auto";
    //     style.marginRight = `${document.body.offsetWidth - rect.right}px`;
    //   } else {
    //     style.marginLeft = `${document.body.scrollLeft + rect.x}px`;
    //     style.marginRight = "auto";
    //   }
    // }
    if (!trigger.dataset['menu']) return

    const items = this.menus.menus[trigger.dataset['menu']] || []
    const cmds = items.filter((i) => i.command).map((i) => this.commands.commands[i.command] as Command) || []
    if (!items) return
    this.menu = Menu({
      workbench: this as Workbench,
      ctx,
      items,
      commands: cmds,
    })
    // TODO: draw logic
    // m.redraw();
    // setTimeout(() => {
    //   // this next frame timeout is so any current dialog can close before attempting
    //   // to showModal on already open dialog, which causes exception.
    //   document.querySelector("main > dialog.menu").showModal();
    // }, 0);
  }

  closeMenu() {
    // TODO: state management
    // document.querySelector("main > dialog.menu").close();
    // workbench.menu.body = () => null;
  }

  showPalette(x: number, y: number, ctx: Context) {
    this.showDialog(() => React.createElement(CommandPalette, { workbench: this, ctx }), false, {
      left: `${x}px`,
      top: `${y}px`,
    })
  }

  showNotice(notice: 'firsttime' | 'github' | 'lockstolen', finished: any) {
    const NoticeComponent = {
      firsttime: FirstTimeMessage,
      github: GitHubMessage,
      lockstolen: LockStolenMessage,
    }[notice]

    this.showDialog(
      () =>
        React.createElement(NoticeComponent as FunctionComponent<any>, {
          workbench: this,
          finished,
        }),
      true,
      undefined,
      notice === 'lockstolen',
    )
  }

  toggleDrawer() {
    this.drawer.open = !this.drawer.open
    // TODO redraw
    // m.redraw();
  }

  showSettings() {
    this.showDialog(() => React.createElement(Settings, { workbench: this }), true)
  }

  showPopover(body: any, style?: {}) {
    this.popover = { body, style }
    // TODO redraw
    // m.redraw();
  }

  closePopover() {
    this.popover = null
    // TODO redraw
    // m.redraw();
  }

  showDialog(body: any, backdrop?: boolean, style?: {}, explicitClose?: boolean) {
    this.dialog = { body, backdrop, style, explicitClose }
    // TODO redraw
    // m.redraw();
    setTimeout(() => {
      // this next frame timeout is so any current dialog can close before attempting
      // to showModal on already open dialog, which causes exception.
      ;(document.querySelector('main > dialog.modal') as HTMLDialogElement)?.showModal()
    }, 0)
  }

  isDialogOpen(): boolean {
    return (document.querySelector('main > dialog.modal') as HTMLDialogElement)?.hasAttribute('open')
  }

  closeDialog() {
    ;(document.querySelector('main > dialog.modal') as HTMLDialogElement)?.close()
    this.dialog.body = () => null
  }

  search(query: string): Node[] {
    if (!query) return []
    // this regex selects spaces NOT inside quotes
    let splitQuery = query.split(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/)
    let textQuery = splitQuery.filter((term) => !term.includes(':')).join(' ')
    let fieldQuery = Object.fromEntries(
      splitQuery.filter((term) => term.includes(':')).map((term) => term.toLowerCase().split(':')),
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
    this.backend.index.search(textQuery).forEach((id) => {
      // @ts-ignore
      let node: Node | null = window.workbench.workspace.find(id)

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
  }
}

function getWeekOfYear(date: Date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  var dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // @ts-ignore
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
