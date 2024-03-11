'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CloudinaryMediaBrowser } from '@/app/_components/cloudinary-media-browser'
import { CodemirrorEditor } from '@/app/_components/codemirror'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Prompt, PromptSchema, PromptVisibilitySchema } from '@/lib/prompts'
import { updatePrompt } from '@/lib/prompts-query'
import { cn } from '@/utils/cn'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, ZapIcon } from 'lucide-react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@coursebuilder/ui'

import { CloudinaryUploadWidget } from '../../_components/cloudinary-upload-widget'
import { PromptAssistant } from './prompt-assistant'

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

type EditPromptFormProps = {
  prompt: Prompt
  form: UseFormReturn<z.infer<typeof PromptSchema>>
}

export function EditPromptForm({ prompt }: Omit<EditPromptFormProps, 'form'>) {
  const form = useForm<z.infer<typeof PromptSchema>>({
    resolver: zodResolver(PromptSchema),
    defaultValues: {
      ...prompt,
      description: prompt.description ?? '',
    },
  })

  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileEditPromptForm prompt={prompt} form={form} />
  ) : (
    <DesktopEditPromptForm prompt={prompt} form={form} />
  )
}

const DesktopEditPromptForm: React.FC<EditPromptFormProps> = ({ prompt, form }) => {
  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof PromptSchema>) => {
    const updatedPrompt = await updatePrompt(values)
    if (updatedPrompt) {
      router.push(`/prompts/${updatedPrompt.slug}`)
    }
  }

  const [activeWidget, setActiveWidget] = React.useState(WIDGETS.values().next().value)

  const formValues = form.getValues()

  const watcher = form.watch(['title', 'body'])

  return (
    <>
      <div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/prompts/${prompt.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Prompt <span className="hidden font-mono text-xs font-normal md:inline-block">({prompt._id})</span>
          </span>
        </div>
        <Button
          onClick={(e) => {
            onSubmit(formValues)
          }}
          type="button"
          variant="default"
          size="sm"
          className="h-7 disabled:cursor-wait"
        >
          Save
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="!flex-col border-t md:!flex-row">
        <ResizablePanel
          className="min-h-[var(--pane-layout-height)] md:min-h-full"
          minSize={5}
          defaultSize={20}
          maxSize={35}
        >
          <Form {...form}>
            <form
              className="min-h-[280px] min-w-[280px]"
              onSubmit={form.handleSubmit(onSubmit, (error) => {
                console.log({ error })
              })}
            >
              <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
                <div className="flex flex-col gap-5 py-5">
                  <PromptMetadataFormFields form={form} />
                </div>
              </ScrollArea>
            </form>
          </Form>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} className="min-h-[var(--pane-layout-height)] md:min-h-full">
          <ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
            <CodemirrorEditor
              roomName={`${prompt._id}`}
              value={prompt.body || ''}
              onChange={async (data) => {
                form.setValue('body', data)
              }}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          className="h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:min-h-full"
          minSize={15}
          defaultSize={25}
          maxSize={50}
        >
          {watcher && activeWidget.id === 'assistant' && <PromptAssistant prompt={{ ...prompt, ...formValues }} />}
          {activeWidget.id === 'media' && (
            <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
              <CloudinaryUploadWidget dir={prompt._type} id={prompt._id} />
              <CloudinaryMediaBrowser />
            </ScrollArea>
          )}
        </ResizablePanel>
        <div className="bg-muted h-12 w-full md:h-[var(--pane-layout-height)] md:w-12 md:border-l">
          <div className="flex flex-row gap-1 p-1 md:flex-col">
            <TooltipProvider delayDuration={0}>
              {Array.from(WIDGETS).map((widget) => (
                <Tooltip key={widget.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      type="button"
                      className={cn(
                        `hover:bg-background/50 flex aspect-square items-center justify-center rounded-lg border p-0 transition`,
                        {
                          'border-border bg-background': activeWidget.id === widget.id,
                          'border-transparent bg-transparent': activeWidget.id !== widget.id,
                        },
                      )}
                      onClick={() => setActiveWidget(widget)}
                    >
                      {widget.icon()}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="capitalize">
                    {widget.id}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </ResizablePanelGroup>
    </>
  )
}

const MobileEditPromptForm: React.FC<EditPromptFormProps> = ({ prompt, form }) => {
  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof PromptSchema>) => {
    const updatedPrompt = await updatePrompt(values)
    if (updatedPrompt) {
      router.push(`/${updatedPrompt.slug}`)
    }
  }

  const formValues = form.getValues()

  return (
    <>
      <div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/prompts/${prompt.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Prompt <span className="hidden font-mono text-xs font-normal md:inline-block">({prompt._id})</span>
          </span>
        </div>
        <Button
          onClick={(e) => {
            onSubmit(formValues)
          }}
          type="button"
          variant="default"
          size="sm"
          className="h-7 disabled:cursor-wait"
        >
          Save
        </Button>
      </div>
      <Form {...form}>
        <form
          className="min-h-[280px] min-w-[280px]"
          onSubmit={form.handleSubmit(onSubmit, (error) => {
            console.log({ error })
          })}
        >
          <div className="flex flex-col gap-5 py-5">
            <PromptMetadataFormFields form={form} />
          </div>
        </form>
      </Form>
      <label className="px-5 text-lg font-bold">Content</label>
      <CodemirrorEditor
        roomName={`${prompt._id}`}
        value={prompt.body || ''}
        onChange={async (data) => {
          form.setValue('body', data)
        }}
      />
    </>
  )
}

const PromptMetadataFormFields = ({ form }: { form: UseFormReturn<z.infer<typeof PromptSchema>> }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>Title</FormLabel>
            <FormDescription>A title should summarize the tip and explain what it is about clearly.</FormDescription>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>Slug</FormLabel>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>Visibility</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose state" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="">
                {PromptVisibilitySchema.options.map((option) => {
                  const value = option._def.value
                  return (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>State</FormLabel>
            <Input {...field} readOnly disabled />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>Short Description</FormLabel>
            <FormDescription>Used as a short &quot;SEO&quot; summary on Twitter cards etc.</FormDescription>
            <Textarea {...field} value={field.value?.toString()} />
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
