import document from './document'
import empty from './empty'
import list from './list'
import table from './table'
import tabs from './tabs'

export const views = {
  list,
  table,
  tabs,
  document,
}

export function getView(name: 'list' | 'table' | 'tabs' | 'document') {
  return views[name] || empty
}

// TODO state management
// window.registerView = (name, view) => {
//   views[name] = view;
//   workbench.commands.registerCommand({
//     id: `view-${name}`,
//     title: `View as ${toTitleCase(name)}`,
//     action: (ctx: Context) => {
//       if (!ctx.node) return;
//       ctx.node.setAttr("view", name);
//     }
//   });
// }

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
