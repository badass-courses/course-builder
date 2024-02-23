import * as React from 'react'
import type { Node } from '@/treehouse/model/mod'
import type { Path } from '@/treehouse/workbench/path'

import type { Workbench } from './workbench'

export const WorkbenchContext = React.createContext<Workbench | null>(null)

export const useWorkbench = () => {
  const workbench = React.useContext(WorkbenchContext)
  if (!workbench) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider')
  }
  return workbench
}

export const WorkbenchProvider = ({ workbench, children }: { workbench: Workbench; children: React.ReactNode }) => {
  React.useEffect(() => {
    workbench.initialize()
  }, [workbench])
  return <WorkbenchContext.Provider value={workbench}>{children}</WorkbenchContext.Provider>
}

/**
 * Context is a user context object interface. This is used to
 * track a global context for the user, mainly what node(s) are selected,
 * but is also used for local context in commands.
 */
export interface Context {
  path: Path | null
  node: Node | null
  nodes?: Node[]
  event?: Event
}
