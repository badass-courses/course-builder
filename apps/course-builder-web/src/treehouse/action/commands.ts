export interface Command {
  id: string
  title?: string
  category?: string
  icon?: string
  hidden?: boolean
  action: Function
  when?: Function
}

export class CommandRegistry {
  commands: { [index: string]: Command }

  constructor() {
    this.commands = {}
  }

  registerCommand(cmd: Command) {
    this.commands[cmd.id] = cmd
  }

  canExecuteCommand(id: string, ...rest: any): boolean {
    console.log('canExecuteCommand', id, this.commands[id])
    const command = this.commands[id]
    if (command) {
      if (command.when && !command.when(...rest)) {
        return false
      }
      return true
    }

    return false
  }

  executeCommand<T>(id: string, ...rest: any): Promise<T> {
    console.log('executeCommand', id, this.commands[id])
    return new Promise((resolve) => {
      const ret = this.commands[id]?.action(...rest)
      resolve(ret)
    })
  }
}
