import { FileStore } from "../backend/mod";
import { Bus, Node, RawNode } from "../model/mod";
import * as module from "../model/module/mod";
import { Path } from "@/treehouse/workbench/path";

/**
 * Workspace is a container for nodes and manages marshaling them using
 * the FileStore backend API. It also keeps track of what nodes have been
 * expanded and what node was last opened. It serializes as JSON with a
 * version indicator and will handle migrations of old versions to the
 * latest when loading. Saving is currently debounced here so this applies
 * to all backends.
 *
 * TODO: don't use file store because we are serverless
 * TODO: this could uses tests
 */
export class Workspace {
  fs: FileStore;
  bus: Bus;

  lastOpenedID: string | null;
  expanded: { [key: string]: { [key: string]: boolean } }; // [rootid][id]
  settings: { theme: string };
  writeDebounce: (path: string, contents: any) => void;

  constructor(fs: FileStore) {
    this.fs = fs;
    this.bus = new module.Bus();
    this.expanded = {};
    this.settings = {
      theme: "light",
    };
    this.lastOpenedID = null;

    this.writeDebounce = debounce(async (path: string, contents: any) => {
      try {
        await this.fs.writeFile(path, contents);
        console.log("Saved workspace.");
      } catch (e: unknown) {
        console.error(e);
        document.dispatchEvent(new CustomEvent("BackendError"));
      }
    });
  }

  get rawNodes(): RawNode[] {
    return this.bus.export();
  }

  observe(fn: (n: Node) => void) {
    this.bus.observe(fn);
  }

  async save(immediate?: boolean) {
    const contents = JSON.stringify(
      {
        version: 1,
        lastopen: this.lastOpenedID,
        expanded: this.expanded,
        nodes: this.rawNodes,
        settings: this.settings,
      },
      null,
      2,
    );
    if (immediate) {
      await this.fs.writeFile("workspace.json", contents);
    } else {
      this.writeDebounce("workspace.json", contents);
    }
  }

  async load() {
    let doc = JSON.parse((await this.fs.readFile("workspace.json")) || "{}");
    if (doc.nodes) {
      doc.nodes = doc.nodes.map((n: any) => {
        // any node migrations:
        if (n.Name === "treehouse.SearchNode") {
          n.Name = "treehouse.SmartNode";
        }
        return n;
      });
      this.bus.import(doc.nodes);
      console.log(`Loaded ${doc.nodes.length} nodes.`);
    }
    if (doc.expanded) {
      // Only import the node keys that still exist
      // in the workspace.
      for (const n in doc.expanded) {
        for (const i in doc.expanded[n]) {
          if (this.bus.find(i)) {
            const localExpanded = this.expanded[n] || {};
            localExpanded[i] = doc.expanded[n][i];
          }
        }
      }
    }
    if (doc.lastopen) {
      this.lastOpenedID = doc.lastopen;
    }
    if (doc.settings) {
      this.settings = Object.assign(this.settings, doc.settings);
    }
  }

  mainNode(): Node {
    let main = this.bus.find("@workspace");
    if (!main) {
      console.info("Building missing workspace node.");
      const root = this.bus.find("@root");
      const ws = this.bus.make("@workspace");
      ws.name = "Workspace";
      ws.parent = root;
      const cal = this.bus.make("@calendar");
      cal.name = "Calendar";
      cal.parent = ws;
      const home = this.bus.make("Home");
      home.parent = ws;
      main = ws;
    }
    return main;
  }

  find(path: string): Node | null {
    return this.bus.find(path);
  }

  new(name: string, value?: any): Node {
    return this.bus.make(name, value);
  }

  // TODO: take single Path
  getExpanded(head: Node | null, n: Node | null): boolean {
    if (!head || !n) {
      return false;
    }
    const localExpanded = this.expanded[head.id] || {};
    let expanded = localExpanded[n.id];
    if (expanded === undefined) {
      expanded = false;
    }
    return expanded;
  }

  // TODO: take single Path
  setExpanded(head: Node, n: Node, b: boolean) {
    const localExpanded = this.expanded[head.id] || {};
    localExpanded[n.id] = b;
    this.save();
  }

  findAbove(path: Path): Path | null {
    if (
      !path.head ||
      !path.node ||
      (path.node && path.head && path.node.id === path.head.id)
    ) {
      return null;
    }
    const p = path.clone();
    p.pop(); // pop to parent
    let prev = path.node.prevSibling;
    if (!prev) {
      // if not a field and parent has fields, return last field
      const fieldCount = path.previous?.getLinked("Fields").length || 0;
      if (path.node.raw.Rel !== "Fields" && fieldCount > 0) {
        return p.append(
          path.previous?.getLinked("Fields")[fieldCount - 1] as Node,
        );
      }
      // if no prev sibling, and no fields, return parent
      return p;
    }
    const lastSubIfExpanded = (p: Path): Path => {
      if (!path.head || !path.node) {
        return p;
      }
      const expanded = this.getExpanded(path.head, p.node as Node);
      if (!expanded) {
        // if not expanded, return input path
        return p;
      }
      const fieldCount = p.node?.getLinked("Fields").length || 0;
      if (p.node?.childCount === 0 && fieldCount > 0) {
        const lastField = p.node.getLinked("Fields")[fieldCount - 1];
        // if expanded, no children, has fields, return last field or its last sub if expanded
        return lastSubIfExpanded(p.append(lastField as Node));
      }
      if (p.node?.childCount === 0) {
        // expanded, no fields, no children
        return p;
      }
      const lastChild = p.node?.children[p.node.childCount - 1];
      // return last child or its last sub if expanded
      return lastSubIfExpanded(p.append(lastChild as Node));
    };
    // return prev sibling or its last child if expanded
    return lastSubIfExpanded(p.append(prev));
  }

  findBelow(path: Path): Path | null {
    // TODO: find a way to indicate pseudo "new" node for expanded leaf nodes
    const p = path.clone();
    if (
      path.head &&
      path.node &&
      this.getExpanded(path.head, path.node) &&
      path.node.getLinked("Fields").length > 0
    ) {
      // if expanded and fields, return first field
      return p.append(path.node.getLinked("Fields")[0] as Node);
    }
    if (
      (this.getExpanded(path.head as Node, path.node as Node) &&
        path.node?.childCount) ||
      0 > 0
    ) {
      // if expanded and children, return first child
      return p.append(path.node?.children[0] as Node);
    }
    const nextSiblingOrParentNextSibling = (p: Path): Path | null => {
      const next = p.node?.nextSibling;
      if (next) {
        p.pop(); // pop to parent
        // if next sibling, return that
        return p.append(next);
      }
      const parent = p.previous;
      if (!parent) {
        // if no parent, return null
        return null;
      }
      if (p.node?.raw.Rel === "Fields" && parent.childCount > 0) {
        p.pop(); // pop to parent
        // if field and parent has children, return first child
        return p.append(parent.children[0] as Node);
      }
      p.pop(); // pop to parent
      // return parents next sibling or parents parents next sibling
      return nextSiblingOrParentNextSibling(p);
    };
    // return next sibling or parents next sibling
    return nextSiblingOrParentNextSibling(p);
  }
}

function debounce(func: any, timeout = 3000) {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // @ts-expect-error
      func.apply(this, args);
    }, timeout);
  };
}
