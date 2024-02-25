import { useEffect } from 'react'
import * as React from 'react'
import { useTreehouseStore } from '@/treehouse/mod'
import { Node } from '@/treehouse/model/mod'

import { Context } from '../workbench/mod'

interface DocumentProps {
  node: Node
}

export const Document: React.FC<DocumentProps> = ({ node }) => {
  const commands = useTreehouseStore((s) => s.commands)
  const executeCommand = useTreehouseStore((s) => s.executeCommand)

  useEffect(() => {
    if (node && node.parent) {
      node.parent.setAttr('view', 'document')
    }
  }, [node])

  useEffect(() => {
    commands.registerCommand({
      id: 'make-document',
      title: 'Make Document',
      action: (ctx: Context) => {
        if (!ctx.node) return
        const doc = React.createElement(Document, { node: ctx.node })
        ctx.node.addComponent(doc)
        ctx.node.changed()
        executeCommand('zoom', ctx)
      },
    })
  }, [])

  const handleIcon = (collapsed: boolean = false) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="node-bullet"
    >
      {/* {collapsed ? <circle id="node-collapsed-handle" stroke="none" cx="12" cy="12" r="12" /> : null} */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )

  // TODO register command
  // Register command in an appropriate place outside of the component,
  // such as in the component that initializes or contains the workbench.
  // This example assumes the command registration logic will be handled elsewhere.

  return (
    <div>
      {/* Render logic for the document component */}
      {handleIcon()}
    </div>
  )
}
