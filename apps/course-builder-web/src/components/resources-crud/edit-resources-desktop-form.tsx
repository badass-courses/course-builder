import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CodemirrorEditor } from '@/components/codemirror'
import { EditResourcesActionBar } from '@/components/resources-crud/edit-resources-action-bar'
import { EditResourcesToolPanel } from '@/components/resources-crud/edit-resources-tool-panel'
import { updateArticle } from '@/lib/articles-query'
import { type UseFormReturn } from 'react-hook-form'
import { Schema, z } from 'zod'

import { Form, ResizableHandle, ResizablePanel, ResizablePanelGroup, ScrollArea } from '@coursebuilder/ui'

export function EditResourcesDesktopForm({
  resource,
  getResourcePath,
  resourceSchema,
  children,
  form,
  updateResource,
}: {
  resource: any
  getResourcePath: (slug: string) => string
  resourceSchema: Schema
  children?: React.ReactNode
  form: UseFormReturn<z.infer<typeof resourceSchema>>
  updateResource: (values: z.infer<typeof resourceSchema>) => Promise<any>
}) {
  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof resourceSchema>) => {
    const updatedResource = await updateResource(values)
    if (updatedResource) {
      router.push(getResourcePath(updatedResource.slug))
    }
  }

  return (
    <>
      <EditResourcesActionBar
        resource={resource}
        resourcePath={getResourcePath(resource.slug)}
        onSubmit={() => {
          onSubmit(form.getValues())
        }}
      />
      <ResizablePanelGroup direction="horizontal" className="!flex-col border-t md:!flex-row">
        <ResizablePanel minSize={5} defaultSize={20} maxSize={35}>
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
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
            <CodemirrorEditor
              roomName={`${resource._id}`}
              value={resource.body || ''}
              onChange={async (data) => {
                form.setValue('body', data)
              }}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        <EditResourcesToolPanel resource={{ ...resource, ...form.getValues() }} />
      </ResizablePanelGroup>
    </>
  )
}
