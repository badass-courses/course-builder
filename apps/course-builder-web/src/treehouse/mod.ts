/**
 * A configurable, embeddable frontend for a graph/outline based note-taking tool.
 *
 * Treehouse can be embedded on a page and given a backend for a fully functional
 * SPA. The backend adapter provides hooks to integrate with various backends.
 *
 * Typical usage involves including resource dependencies on the page then running:
 *
 * ```ts
 * import {setup, BrowserBackend} from "https://treehouse.sh/lib/treehouse.min.js";
 * setup(document, document.body, new BrowserBackend());
 * ```
 *
 * In this case using the built-in BrowserBackend to store state in localStorage.
 * For more information see the [Quickstart Guide](https://treehouse.sh/docs/quickstart/).
 *
 * @module
 */
import { Document } from '@/treehouse/com/document'
import { objectManaged } from '@/treehouse/model/hooks'
import { Node } from '@/treehouse/model/mod'
import { Context } from '@/treehouse/workbench/mod'
import { createWorkbenchSlice, Workbench } from '@/treehouse/workbench/workbench'
import { createWorkspaceSlice, Workspace } from '@/treehouse/workbench/workspace'
import { create } from 'zustand'

import { Backend } from './backend/mod'
import { Path } from './workbench/path'

// export { BrowserBackend, SearchIndex_MiniSearch } from "./backend/browser";
// export { GitHubBackend } from "./backend/github";

export const useTreehouseStore = create<Workbench & Workspace>((...a) => ({
  ...createWorkbenchSlice(...a),
  ...createWorkspaceSlice(...a),
}))

/**
 * setup initializes and mounts a workbench UI with a given backend adapter to a document.
 * More specifically, first it initializes the given backend, then creates and initializes
 * a Workbench instance with that backend, then it mounts the App component to the given
 * target element. It will also add some event listeners to the document and currently
 * this is where it registers all the built-in commands and their keybindings, as well
 * as menus.
 */
export async function setup(document: Document, backend: Backend) {
  if (backend.initialize) {
    await backend.initialize()
  }
  const treehouseStore = useTreehouseStore.getState()

  await treehouseStore.initializeWorkbench(backend)

  // TODO initialize context
  // window.workbench = workbench;

  // TODO: initialize components via context
  // [
  //   Document,
  //   // Tag,
  //   Template,
  //   SmartNode,
  // ].forEach(com => {
  //   if (com.initialize) {
  //     com.initialize(workbench);
  //   }
  // });

  // pretty specific to github backend right now
  document.addEventListener('BackendError', () => {
    treehouseStore.showNotice('lockstolen', () => {
      location.reload()
    })
  })

  treehouseStore.commands.registerCommand({
    id: 'cut',
    title: 'Cut',
    when: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return false

      // no text is selected
      const input = treehouseStore.getInput(ctx.path)
      if (input && input.selectionStart === input.selectionEnd) {
        return true
      }

      // builtin copy is being performed,
      // clear clipboard so it doesn't override on paste
      useTreehouseStore.setState({ clipboard: undefined })

      return false
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      useTreehouseStore.setState({ clipboard: { op: 'cut', node: ctx.node } })
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'cut', key: 'meta+x' })

  treehouseStore.commands.registerCommand({
    id: 'copy',
    title: 'Copy',
    when: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return false

      // no text is selected
      const input = treehouseStore.getInput(ctx.path)
      if (input && input.selectionStart === input.selectionEnd) {
        return true
      }

      // builtin copy is being performed,
      // clear clipboard so it doesn't override on paste
      useTreehouseStore.setState({ clipboard: undefined })

      return false
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      useTreehouseStore.setState({ clipboard: { op: 'copy', node: ctx.node } })
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'copy', key: 'meta+c' })

  treehouseStore.commands.registerCommand({
    id: 'copy-reference',
    title: 'Copy as Reference',
    when: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return false

      // no text is selected
      const input = treehouseStore.getInput(ctx.path)
      if (input && input.selectionStart === input.selectionEnd) {
        return true
      }

      // builtin copy is being performed,
      // clear clipboard so it doesn't override on paste
      useTreehouseStore.setState({ clipboard: undefined })
      return false
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      useTreehouseStore.setState({ clipboard: { op: 'copyref', node: ctx.node } })
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'copy-reference', key: 'shift+ctrl+c' })

  treehouseStore.commands.registerCommand({
    id: 'paste',
    title: 'Paste',
    when: (ctx: Context) => {
      const { clipboard } = useTreehouseStore.getState()
      if (clipboard) {
        return true
      }
      return false
    },
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return
      const { clipboard } = useTreehouseStore.getState()
      if (!clipboard?.op || !clipboard.node) return
      switch (clipboard.op) {
        case 'copy':
          useTreehouseStore.setState({ clipboard: { op: clipboard.op, node: clipboard.node.duplicate() } })
          break
        case 'copyref':
          const ref = treehouseStore.newWorkspace('')
          ref.refTo = clipboard.node
          useTreehouseStore.setState({ clipboard: { op: clipboard.op, node: ref } })
          break
      }
      if (clipboard.node.raw.Rel === 'Fields') {
        clipboard.node.raw.Parent = ctx.node.parent?.id
        useTreehouseStore.setState({ clipboard: { op: clipboard.op, node: clipboard.node } })
        ctx.node.parent?.addLinked('Fields', clipboard.node)
      } else {
        clipboard.node.parent = ctx.node.parent
        clipboard.node.siblingIndex = ctx.node.siblingIndex
        useTreehouseStore.setState({ clipboard: { op: clipboard.op, node: clipboard.node } })
      }
      const p = ctx.path.clone()
      p.pop()
      const newPath = p.append(clipboard.node)
      setTimeout(() => {
        treehouseStore.focus(newPath)
      }, 0)
      if (clipboard.op === 'cut') {
        useTreehouseStore.setState({ clipboard: undefined })
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'paste', key: 'meta+v' })

  treehouseStore.commands.registerCommand({
    id: 'view-list',
    title: 'View as List',
    when: (ctx: Context) => {
      if (!ctx.node) return false
      if (ctx.node.raw.Rel === 'Fields') return false
      if (ctx.node.parent && ctx.node.parent.hasComponent(Document)) return false
      return true
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      ctx.node.setAttr('view', 'list')
      useTreehouseStore.setState({ context: { node: ctx.node, path: ctx.path } })
    },
  })

  treehouseStore.commands.registerCommand({
    id: 'view-table',
    title: 'View as Table',
    when: (ctx: Context) => {
      if (!ctx.node) return false
      if (ctx.node.raw.Rel === 'Fields') return false
      return !(ctx.node.parent && ctx.node.parent.hasComponent(Document))
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      ctx.node.setAttr('view', 'table')
      ctx.node.children.forEach((child) => {
        if (!ctx.path) return
        const { setExpanded } = useTreehouseStore.getState()
        setExpanded(ctx.path.head, child, false)
      })
    },
  })

  treehouseStore.commands.registerCommand({
    id: 'view-tabs',
    title: 'View as Tabs',
    when: (ctx: Context) => {
      if (!ctx.node) return false
      if (ctx.node.raw.Rel === 'Fields') return false
      return !(ctx.node.parent && ctx.node.parent.hasComponent(Document))
    },
    action: (ctx: Context) => {
      if (!ctx.node) return
      ctx.node.setAttr('view', 'tabs')
      useTreehouseStore.setState({ context: { node: ctx.node, path: ctx.path } })
    },
  })

  // TODO checkbox component
  // workbench.commands.registerCommand({
  //   id: "add-checkbox",
  //   title: "Add checkbox",
  //   when: (ctx: Context) => {
  //     if (!ctx.node) return false;
  //     if (ctx.node.hasComponent(Checkbox)) return false;
  //     if (ctx.node.raw.Rel === "Fields") return false;
  //     if (ctx.node.parent && ctx.node.parent.hasComponent(Document)) return false;
  //     return true;
  //   },
  //   action: (ctx: Context) => {
  //     const checkbox = new Checkbox();
  //     ctx.node.addComponent(checkbox);
  //   }
  // });

  // TODO checkbox component
  // workbench.commands.registerCommand({
  //   id: "remove-checkbox",
  //   title: "Remove checkbox",
  //   when: (ctx: Context) => {
  //     if (!ctx.node) return false;
  //     if (ctx.node.raw.Rel === "Fields") return false;
  //     if (ctx.node.parent && ctx.node.parent.hasComponent(Document)) return false;
  //     if (ctx.node.hasComponent(Checkbox)) return true;
  //     return false;
  //   },
  //   action: (ctx: Context) => {
  //     ctx.node.removeComponent(Checkbox);
  //   }
  // });

  // TODO textfield component
  // workbench.commands.registerCommand({
  //   id: "create-field",
  //   title: "Create Field",
  //   action: (ctx: Context) => {
  //     if (!ctx.node) return;
  //     if (ctx.node.childCount > 0) return;
  //     if (ctx.node.componentCount > 0) return;
  //     if (ctx.path.previous && objectManaged(ctx.path.previous)) return;
  //     const path = ctx.path.clone();
  //     path.pop(); // drop node
  //     const field = workbench.workspace.new(ctx.node.name, "");
  //     field.raw.Parent = ctx.node.parent.id;
  //     const text = new TextField();
  //     field.addComponent(text);
  //     ctx.node.parent.addLinked("Fields", field);
  //     path.push(field);
  //     ctx.node.destroy();
  //     workbench.focus(path);
  //   }
  // });

  // TODO checkbox component
  // workbench.commands.registerCommand({
  //   id: "mark-done",
  //   title: "Mark Done",
  //   when: (ctx: Context) => {
  //     if (!ctx.node) return false;
  //     if (ctx.node.raw.Rel === "Fields") return false;
  //     if (ctx.node.parent && ctx.node.parent.hasComponent(Document)) return false;
  //     return true;
  //   },
  //   action: (ctx: Context) => {
  //     if (!ctx.node) return;
  //     if (ctx.node.hasComponent(Checkbox)) {
  //       const checkbox = ctx.node.getComponent(Checkbox);
  //       if (!checkbox.checked) {
  //         checkbox.checked = true;
  //         ctx.node.changed();
  //       } else {
  //         ctx.node.removeComponent(Checkbox);
  //       }
  //     } else {
  //       const checkbox = new Checkbox();
  //       ctx.node.addComponent(checkbox);
  //     }
  //   }
  // });
  // workbench.keybindings.registerBinding({ command: "mark-done", key: "meta+enter" });
  //

  treehouseStore.commands.registerCommand({
    id: 'expand',
    title: 'Expand',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      treehouseStore.setExpanded(ctx.path.head, ctx.node, true)
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'expand', key: 'meta+arrowdown' })
  treehouseStore.commands.registerCommand({
    id: 'collapse',
    title: 'Collapse',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      treehouseStore.setExpanded(ctx.path.head, ctx.node, false)
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'collapse', key: 'meta+arrowup' })
  treehouseStore.commands.registerCommand({
    id: 'indent',
    title: 'Indent',
    when: (ctx: Context) => {
      if (!ctx.node) return false
      if (ctx.node.raw.Rel === 'Fields') return false
      return !(ctx.node.parent && ctx.node.parent.hasComponent(Document))
    },
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const node = ctx.node // redraw seems to unset ctx.node
      const path = ctx.path.clone()
      let prev = node.prevSibling
      while (prev && objectManaged(prev)) {
        prev = prev.prevSibling
        if (!prev) return
      }
      if (prev !== null) {
        path.pop() // drop node
        path.push(prev)
        node.parent = prev
        path.push(node)
        treehouseStore.setExpanded(ctx.path.head, prev, true)
        setTimeout(() => {
          treehouseStore.focus(path)
        }, 0)
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'indent', key: 'tab' })
  treehouseStore.commands.registerCommand({
    id: 'outdent',
    title: 'Outdent',
    when: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return false
      if (ctx.node.raw.Rel === 'Fields') return false
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return false
      return !(ctx.node.parent && ctx.node.parent.hasComponent(Document))
    },
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const node = ctx.node // redraw seems to unset ctx.node
      const parent = ctx.path.previous
      const path = ctx.path.clone()
      const { lastOpenedID } = useTreehouseStore.getState()
      if (parent !== null && parent.id !== '@root' && parent.id !== lastOpenedID) {
        path.pop() // drop node
        path.pop() // drop parent
        node.parent = parent.parent
        path.push(node)
        node.siblingIndex = parent.siblingIndex + 1
        if (parent.childCount === 0 && parent.getLinked('Fields').length === 0) {
          treehouseStore.setExpanded(ctx.path.head, parent, false)
        }
        setTimeout(() => {
          treehouseStore.focus(path)
        }, 0)
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'outdent', key: 'shift+tab' })
  treehouseStore.commands.registerCommand({
    id: 'move-up',
    title: 'Move Up',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const node = ctx.node // redraw seems to unset ctx.node
      const parent = node.parent
      if (parent !== null && parent.id !== '@root') {
        const children = parent.childCount
        if (node.siblingIndex === 0) {
          if (!parent.prevSibling) {
            return
          }
          const p = ctx.path.clone()
          p.pop() // drop node
          p.pop() // drop parent
          let parentSib = parent.prevSibling
          while (parentSib && objectManaged(parentSib)) {
            parentSib = parentSib.prevSibling as unknown as Node
            if (!parentSib) return
          }
          p.push(parentSib)
          p.push(node)
          node.parent = parentSib
          node.siblingIndex = parentSib.childCount - 1
          treehouseStore.setExpanded(ctx.path.head, parentSib, true)
          setTimeout(() => {
            treehouseStore.focus(p)
          }, 0)
        } else {
          if (children === 1) {
            return
          }
          node.siblingIndex = node.siblingIndex - 1
        }
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'move-up', key: 'shift+meta+arrowup' })
  treehouseStore.commands.registerCommand({
    id: 'move-down',
    title: 'Move Down',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const node = ctx.node // redraw seems to unset ctx.node
      const parent = node.parent
      if (parent !== null && parent.id !== '@root') {
        const children = parent.childCount
        // if last child
        if (node.siblingIndex === children - 1) {
          if (!parent.nextSibling) {
            return
          }
          const p = ctx.path.clone()
          p.pop() // drop node
          p.pop() // drop parent
          let parentSib = parent.nextSibling
          while (parentSib && objectManaged(parentSib)) {
            parentSib = parentSib.nextSibling as unknown as Node
            if (!parentSib) return
          }
          p.push(parentSib)
          p.push(node)
          node.parent = parentSib
          node.siblingIndex = 0
          treehouseStore.setExpanded(ctx.path.head, parentSib, true)
          setTimeout(() => {
            treehouseStore.focus(p)
          }, 0)
        } else {
          if (children === 1) {
            return
          }
          node.siblingIndex = node.siblingIndex + 1
        }
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'move-down', key: 'shift+meta+arrowdown' })
  treehouseStore.commands.registerCommand({
    id: 'insert-child',
    title: 'Insert Child',
    action: (ctx: Context, name: string = '', siblingIndex?: number) => {
      if (!ctx.node || !ctx.path) return
      if (objectManaged(ctx.node)) return
      const node = treehouseStore.newWorkspace(name)
      node.parent = ctx.node
      if (siblingIndex !== undefined) {
        node.siblingIndex = siblingIndex
      }
      treehouseStore.setExpanded(ctx.path.head, ctx.node, true)
      const newPath = ctx.path.append(node)
      setTimeout(() => {
        treehouseStore.focus(newPath, name.length)
      }, 0)
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'insert-before',
    title: 'Insert Before',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return
      const node = treehouseStore.newWorkspace('')
      node.parent = ctx.node.parent
      node.siblingIndex = ctx.node.siblingIndex
      const p = ctx.path.clone()
      p.pop()
      const newPath = p.append(node)
      setTimeout(() => {
        treehouseStore.focus(newPath)
      }, 0)
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'insert',
    title: 'Insert Node',
    action: (ctx: Context, name: string = '') => {
      if (!ctx.node || !ctx.path) return
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return

      const node = treehouseStore.newWorkspace(name)
      console.log('insert', ctx.node, ctx.path, node)
      node.parent = ctx.node.parent
      node.siblingIndex = ctx.node.siblingIndex + 1
      const p = ctx.path.clone()
      p.pop()
      const newPath = p.append(node)
      setTimeout(() => {
        treehouseStore.focus(newPath)
      }, 0)
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'insert', key: 'shift+enter' })
  treehouseStore.commands.registerCommand({
    id: 'create-reference',
    title: 'Create Reference',
    action: (ctx: Context) => {
      // TODO: prevent creating reference to reference
      if (!ctx.node || !ctx.path) return
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return
      const node = treehouseStore.newWorkspace('')
      node.parent = ctx.node.parent
      node.siblingIndex = ctx.node.siblingIndex + 1
      node.refTo = ctx.node
      const p = ctx.path.clone()
      p.pop()
      const newPath = p.append(node)
      setTimeout(() => {
        treehouseStore.focus(newPath)
      }, 0)
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'delete',
    title: 'Delete Node',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      if (ctx.node.id.startsWith('@')) return
      if (ctx.path.previous && objectManaged(ctx.path.previous)) return // should probably provide feedback or disable delete
      const above = treehouseStore.findAbove(ctx.path)

      ctx.node.destroy()
      if (above) {
        let pos = 0
        // @ts-ignore
        if (ctx.event && ctx.event.key === 'Backspace') {
          if (above.node.value) {
            pos = above.node.value.length
          } else {
            pos = above.node.name.length
          }
        }
        if (above.node.childCount === 0) {
          // TODO: use subCount
          treehouseStore.setExpanded(ctx.path.head, above.node, false)
        }
        setTimeout(() => {
          treehouseStore.focus(above, pos)
        }, 0)
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'delete', key: 'shift+meta+backspace' })
  treehouseStore.commands.registerCommand({
    id: 'prev',
    title: 'Previous Node',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const above = treehouseStore.findAbove(ctx.path)
      if (above) {
        setTimeout(() => {
          treehouseStore.focus(above)
        }, 0)
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'prev', key: 'arrowup' })
  treehouseStore.commands.registerCommand({
    id: 'next',
    title: 'Next Node',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      const below = treehouseStore.findBelow(ctx.path)
      if (below) {
        setTimeout(() => {
          treehouseStore.focus(below)
        }, 0)
      }
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'next', key: 'arrowdown' })
  treehouseStore.commands.registerCommand({
    id: 'pick-command',
    title: 'Command Palette',
    hidden: true,
    when: (ctx: Context) => {
      return !treehouseStore.isDialogOpen()
    },
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      let node = ctx.node
      let path = ctx.path
      let posBelow = false
      if (!node) {
        // no node is selected, use panel node
        node = ctx.path.head
        path = new Path(ctx.path.head, ctx.path.name)
        posBelow = true
      }
      const trigger = treehouseStore.getInput(path)
      const rect = trigger.getBoundingClientRect()
      let x = document.body.scrollLeft + rect.x + trigger.selectionStart * 10 + 20
      let y = document.body.scrollTop + rect.y - 8
      if (trigger.coordsAtCursor) {
        x = trigger.coordsAtCursor.left - 17
        y = trigger.coordsAtCursor.top - 16
      }
      if (posBelow) {
        x = document.body.scrollLeft + rect.x
        y = document.body.scrollTop + rect.y + rect.height
      }
      treehouseStore.showPalette(x, y, treehouseStore.newContext({ node }))
    },
  })
  treehouseStore.keybindings.registerBinding({ command: 'pick-command', key: 'meta+k' })
  treehouseStore.commands.registerCommand({
    id: 'new-panel',
    title: 'Open in New Panel',
    action: (ctx: Context) => {
      if (!ctx.node) return
      treehouseStore.openNewPanel(ctx.node)
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'close-panel',
    title: 'Close Panel',
    action: (ctx: Context, panel?: Path) => {
      if (!ctx.path) return
      const { context } = useTreehouseStore.getState()
      treehouseStore.closePanel(panel || ctx.path)
      useTreehouseStore.setState({ context: { ...context, path: treehouseStore.mainPanel() } })
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'zoom',
    title: 'Open',
    action: (ctx: Context) => {
      if (!ctx.node || !ctx.path) return
      treehouseStore.open(ctx.node)
    },
  })
  treehouseStore.commands.registerCommand({
    id: 'generate-random',
    hidden: true,
    title: 'Generate Random Children',
    action: (ctx: Context) => {
      if (!ctx.node) return
      ;[...Array(100)].forEach(() => {
        const node = treehouseStore.newWorkspace(generateName(8))
        node.parent = ctx.node
      })
    },
  })

  treehouseStore.menus.registerMenu('node', [
    { command: 'zoom' },
    { command: 'new-panel' },
    { command: 'cut' },
    { command: 'copy' },
    { command: 'paste' },
    { command: 'indent' },
    { command: 'outdent' },
    { command: 'move-up' },
    { command: 'move-down' },
    { command: 'delete' },
    // {command: "add-checkbox"},
    // {command: "remove-checkbox"},
    // {command: "mark-done"},
    // {command: "add-page"},
    // {command: "remove-page"},
    // {command: "generate-random"},
    // {command: "create-reference"},
  ])

  document.addEventListener('keydown', (e) => {
    const binding = treehouseStore.keybindings.evaluateEvent(e)
    const { context } = useTreehouseStore.getState()
    if (binding && treehouseStore.canExecuteCommand(binding.command, context)) {
      treehouseStore.executeCommand(binding.command, context)
      e.stopPropagation()
      e.preventDefault()
      return
    }
  })
}

function generateName(length = 10) {
  const random = (min: any, max: any) => {
    return Math.round(Math.random() * (max - min) + min)
  }
  const word = () => {
    const words = [
      'got',
      'ability',
      'shop',
      'recall',
      'fruit',
      'easy',
      'dirty',
      'giant',
      'shaking',
      'ground',
      'weather',
      'lesson',
      'almost',
      'square',
      'forward',
      'bend',
      'cold',
      'broken',
      'distant',
      'adjective',
    ]
    return words[random(0, words.length - 1)]
  }
  const words = (length: number) =>
    [...Array(length)]
      .map((_, i) => word())
      .join(' ')
      .trim()
  return words(random(2, length))
}
