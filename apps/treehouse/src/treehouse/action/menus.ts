export interface MenuItem {
  command: string;
  //alt?: string;
  when?: Function;
  title?: Function;
  onclick?: Function;
  disabled?: boolean;
  //group
  //submenu
}

export class MenuRegistry {
  menus: { [index: string]: MenuItem[] };

  constructor() {
    this.menus = {};
  }

  registerMenu(id: string, items: MenuItem[]) {
    this.menus[id] = items;
  }
}
