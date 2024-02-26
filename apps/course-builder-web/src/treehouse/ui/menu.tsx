import { SyntheticEvent } from 'react'
import { Command } from '@/treehouse/action/commands'
import { MenuItem } from '@/treehouse/action/menus'
import { useTreehouseStore } from '@/treehouse/mod'
import { Context } from '@/treehouse/workbench/mod'
import { Workbench } from '@/treehouse/workbench/workbench'

import { bindingSymbols } from '../action/keybinds'

function isDisabled(item: MenuItem, cmd: Command, ctx: Context) {
  const { canExecuteCommand } = useTreehouseStore.getState()
  if (cmd) {
    return item.disabled || !canExecuteCommand(cmd.id, ctx)
  }
  return item.disabled
}

export const Menu = ({ items, commands, ctx }: { items: any[]; commands: Command[]; ctx: Context }) => {
  const closeMenu = useTreehouseStore((s) => s.closeMenu)
  const executeCommand = useTreehouseStore((s) => s.executeCommand)
  const keybindings = useTreehouseStore((s) => s.keybindings)

  const onclick = (item: MenuItem, cmd: Command) => (e: SyntheticEvent) => {
    console.log('leeeeeroooooooooooy jeeeeeeeeeeeenkins!')
    e.stopPropagation()
    console.log('onclick', item, cmd, ctx)
    if (isDisabled(item, cmd, ctx)) {
      return
    }
    closeMenu()
    if (item.onclick) {
      item.onclick()
    }
    if (cmd) {
      executeCommand(cmd.id, ctx)
    }
  }

  return (
    <ul
      className="menu"
      style={{
        margin: '0',
        display: 'inline-block',
      }}
    >
      {items
        .filter((i) => !i.when || i.when())
        .map((i) => {
          let title = ''
          let binding = undefined
          let cmd: Command | undefined = undefined

          if (i.command) {
            cmd = commands.find((c) => c.id === i.command)
            if (!cmd) return null
            binding = keybindings.getBinding(cmd.id)
            title = cmd.title || ''
          }
          if (i.title) {
            title = i.title()
          }
          if (!cmd) return null

          return (
            <li
              key={cmd.id}
              onClick={onclick(i, cmd as Command)}
              className={isDisabled(i, cmd, ctx) ? 'disabled' : ''}
              style={{
                display: 'flex',
              }}
            >
              <div>{title}</div>
              {binding && (
                <div className="keybindings grow text-right">{bindingSymbols(binding.key).join(' ').toUpperCase()}</div>
              )}
            </li>
          )
        })}
    </ul>
  )
}

/* <li style={liStyle}><div>Indent</div><div style={shortcutStyle}>shift+A</div></li>
<li style={liStyle}><div>Open in new panel</div><div style={shortcutStyle}>shift+meta+Backspace</div></li>
<hr style={{marginLeft: "0.5rem", marginRight: "0.5rem" }} />
<li style={liStyle}>Show list view</li>
<li style={liStyle}>Move</li>
<li style={liStyle}>Delete node</li>
<hr style={{marginLeft: "0.5rem", marginRight: "0.5rem" }} /> */
