import * as React from "react";

import type { Node } from "@/treehouse/model/mod";
import type { Workbench } from "./workbench";
import type { Path } from "@/treehouse/workbench/path";

export const WorkbenchContext = React.createContext<Workbench | null>(null);

/**
 * Context is a user context object interface. This is used to
 * track a global context for the user, mainly what node(s) are selected,
 * but is also used for local context in commands.
 */
export interface Context {
  path: Path | null;
  node: Node | null;
  nodes?: Node[];
  event?: Event;
}
