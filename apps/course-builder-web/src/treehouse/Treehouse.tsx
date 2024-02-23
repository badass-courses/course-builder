'use client'

import * as React from 'react'
import { SearchIndex } from '@/treehouse/backend/mod'
import { RawNode } from '@/treehouse/model/mod'
import { WorkbenchProvider } from '@/treehouse/workbench/mod'
import { Workbench } from '@/treehouse/workbench/workbench'

export class LoggerBackend {
  auth: null
  index: SearchIndex
  files: FileStore

  constructor() {
    this.auth = null
    this.files = new FileStore()
    this.index = new SearchIndex_Dumb()
  }
}

export const Treehouse = ({ children }: { children?: React.ReactNode }) => {
  const [workbench, setWorkbench] = React.useState<Workbench | null>(null)

  React.useEffect(() => {
    setWorkbench(new Workbench(new LoggerBackend()))
  }, [])

  if (!workbench) {
    return null
  }

  console.log('workbench', workbench)
  return <WorkbenchProvider workbench={workbench}>{children}</WorkbenchProvider>
}

export class SearchIndex_Dumb {
  nodes: Record<string, string>

  constructor() {
    this.nodes = {}
  }

  index(node: RawNode) {
    this.nodes[node.ID] = node.Name
  }

  remove(id: string) {
    delete this.nodes[id]
  }

  search(query: string): string[] {
    const results: string[] = []
    for (const id in this.nodes) {
      if (this.nodes[id]?.includes(query)) {
        results.push(id)
      }
    }
    return results
  }
}

export class FileStore {
  async readFile(path: string): Promise<string | null> {
    return Promise.resolve(localStorage.getItem(`treehouse:${path}`))
  }

  async writeFile(path: string, contents: string) {
    localStorage.setItem(`treehouse:${path}`, contents)
    return Promise.resolve()
  }
}
