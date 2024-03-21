import * as React from 'react'

import { ResizablePanelGroup } from '@coursebuilder/ui'

export function EditResourcePanelGroup({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="!flex-col border-t md:!flex-row"
    >
      {children}
    </ResizablePanelGroup>
  )
}
