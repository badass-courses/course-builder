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
import { Workbench } from '@/treehouse/workbench/workbench'

import { Backend } from './backend/mod'

// export { BrowserBackend, SearchIndex_MiniSearch } from "./backend/browser";
// export { GitHubBackend } from "./backend/github";

/**
 * setup initializes and mounts a workbench UI with a given backend adapter to a document.
 * More specifically, first it initializes the given backend, then creates and initializes
 * a Workbench instance with that backend, then it mounts the App component to the given
 * target element. It will also add some event listeners to the document and currently
 * this is where it registers all the built-in commands and their keybindings, as well
 * as menus.
 */
export async function setup(document: Document, target: HTMLElement, backend: Backend) {
  if (backend.initialize) {
    await backend.initialize()
  }

  const workbench = new Workbench(backend)

  // TODO initialize context
  // window.workbench = workbench;

  await workbench.initialize()

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
    workbench.showNotice('lockstolen', () => {
      location.reload()
    })
  })

  document.addEventListener('keydown', (e) => {
    const binding = workbench.keybindings.evaluateEvent(e)
    if (binding && workbench.canExecuteCommand(binding.command, workbench.context)) {
      workbench.executeCommand(binding.command, workbench.context)
      e.stopPropagation()
      e.preventDefault()
      return
    }
  })

  // m.mount(target, { view: () => m(App, { workbench }) });
}
