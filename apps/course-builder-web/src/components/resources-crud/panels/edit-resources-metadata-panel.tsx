import * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Form, ResizablePanel, ScrollArea } from '@coursebuilder/ui'

export function EditResourcesMetadataPanel({
  form,
  children,
  onSubmit,
}: {
  form: UseFormReturn<any>
  children: React.ReactNode
  onSubmit: (values: any) => Promise<void>
}) {
  return (
    <ResizablePanel
      minSize={5}
      defaultSize={20}
      maxSize={35}
      className="min-h-[var(--pane-layout-height)] md:min-h-full"
    >
      <Form {...form}>
        <form
          className="min-h-[280px] min-w-[280px]"
          onSubmit={form.handleSubmit(onSubmit, (error) => {
            console.log({ error })
          })}
        >
          <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
            <div className="flex flex-col gap-5 py-5">{children}</div>
          </ScrollArea>
        </form>
      </Form>
    </ResizablePanel>
  )
}
