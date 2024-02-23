export function bindingSymbols(key?: string): string[] {
  if (!key) return []
  const symbols: Record<string, string> = {
    backspace: '⌫',
    shift: '⇧',
    meta: '⌘',
    tab: '↹',
    ctrl: '⌃',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    enter: '⏎',
  }
  const keys = key.toLowerCase().split('+')
  return keys
    .map(filterKeyForNonMacMeta)
    .map((k) => (Boolean(Object.keys(symbols).includes(k)) ? symbols[k] : k)) as string[]
}

// if key is meta and not on a mac, change it to ctrl,
// otherwise return the key as is
function filterKeyForNonMacMeta(key: string): string {
  const isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1
  return !isMac && key === 'meta' ? 'ctrl' : key
}

export interface Binding {
  command: string
  key: string
  //when
  //args
}

export class KeyBindings {
  bindings: Binding[]

  constructor() {
    this.bindings = []
  }

  registerBinding(binding: Binding) {
    this.bindings.push(binding)
  }

  getBinding(commandId: string): Binding | null {
    for (const b of this.bindings) {
      if (b.command === commandId) {
        return b
      }
    }
    return null
  }

  evaluateEvent(event: KeyboardEvent): Binding | null {
    bindings: for (const b of this.bindings) {
      let modifiers = b.key.toLowerCase().split('+')
      let key = modifiers.pop()
      if (key !== event.key.toLowerCase()) {
        continue
      }
      for (const checkMod of ['shift', 'ctrl', 'alt', 'meta']) {
        let hasMod = modifiers.includes(checkMod)
        const isMac = navigator.userAgent.toLowerCase().indexOf('mac') !== -1
        if (!isMac) {
          if (checkMod === 'meta') continue
          if (checkMod === 'ctrl') {
            hasMod = modifiers.includes('meta') || modifiers.includes('ctrl')
          }
        }
        // @ts-ignore
        const modState = event[`${filterKeyForNonMacMeta(checkMod)}Key`]
        if (!modState && hasMod) {
          continue bindings
        }
        if (modState && !hasMod) {
          continue bindings
        }
      }
      return b
    }
    return null
  }
}
