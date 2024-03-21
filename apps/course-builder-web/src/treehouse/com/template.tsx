import * as React from 'react'
import { useContext, useEffect } from 'react'
import { Workbench } from '@/treehouse/workbench/workbench'
import { Workspace } from '@/treehouse/workbench/workspace'

import { component } from '../model/components'
import { Node } from '../model/mod'

interface TemplateProps {
  node: Node
}

export const Template: React.FC<TemplateProps> = ({ node }) => {
  useEffect(() => {
    // Assuming onAttach logic or similar initialization
    if (node && node.parent) {
      // Perform actions as needed when the component is attached to a node
    }
  }, [node])

  const handleIcon = (collapsed: boolean = false) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="node-bullet"
    >
      {collapsed ? (
        <circle
          id="node-collapsed-handle"
          stroke="none"
          cx="12"
          cy="12"
          r="12"
        />
      ) : null}
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  )

  // Register command in an appropriate place outside of the component,
  // such as in the component that initializes or contains the workbench.
  // This example assumes the command registration logic will be handled elsewhere.

  return (
    <div>
      {/* Render logic for the template component */}
      {handleIcon()}
    </div>
  )
}
