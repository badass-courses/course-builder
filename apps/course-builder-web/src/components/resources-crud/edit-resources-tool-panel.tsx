import * as React from 'react'
import { EditResourcesToolPanelContents } from '@/components/resources-crud/edit-resources-tool-panel-contents'
import { EditResourcesToolbar } from '@/components/resources-crud/edit-resources-toolbar'
import { cn } from '@/utils/cn'
import { ImagePlusIcon, ZapIcon } from 'lucide-react'

import { ResizablePanel } from '@coursebuilder/ui'

const WIDGETS = new Set([
  {
    id: 'assistant',
    icon: () => <ZapIcon strokeWidth={1.5} size={24} width={18} height={18} />,
  },
  {
    id: 'media',
    icon: () => <ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />,
  },
])

export function EditResourcesToolPanel({
  resource,
  className,
  minSize = 15,
  maxSize = 50,
  defaultSize = 25,
}: {
  minSize?: number
  defaultSize?: number
  maxSize?: number
  className?: string
  resource: { _type: string; _id: string; body?: string | null; title?: string | null }
}) {
  const [activeToolId, setActiveToolId] = React.useState<string>(WIDGETS.values().next().value.id)
  return (
    <>
      <ResizablePanel
        className={cn('h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:min-h-full', className)}
        minSize={minSize}
        defaultSize={defaultSize}
        maxSize={maxSize}
      >
        <EditResourcesToolPanelContents resource={resource} activeToolId={activeToolId} />
      </ResizablePanel>
      <EditResourcesToolbar tools={WIDGETS} onToolChange={(tool) => setActiveToolId(tool.id)} />
    </>
  )
}
