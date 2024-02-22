export interface Command {
  id: string;
  title?: string;
  category?: string;
  icon?: string;
  hidden?: boolean;
  action: Function;
  when?: Function;
}

export class CommandRegistry {
  commands: { [index: string]: Command };

  constructor() {
    this.commands = {};
  }

  registerCommand(cmd: Command) {
    this.commands[cmd.id] = cmd;
  }

  canExecuteCommand(id: string, ...rest: any): boolean {
    if (this.commands[id] && this.commands[id]?.when) {
      return !(this.commands[id]?.when && !this.commands[id]?.when?.(...rest));
    }
    return false;
  }

  executeCommand<T>(id: string, ...rest: any): Promise<T> {
    return new Promise((resolve) => {
      const ret = this.commands[id]?.action(...rest);
      resolve(ret);
    });
  }
}
