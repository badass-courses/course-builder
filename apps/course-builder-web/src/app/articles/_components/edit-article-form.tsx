'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CodemirrorEditor } from '@/app/_components/codemirror'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useSocket } from '@/hooks/use-socket'
import { Article, ArticleSchema, ArticleVisibilitySchema } from '@/lib/articles'
import { FeedbackMarker } from '@/lib/feedback-marker'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
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

import { ArticleAssistant } from './article-assistant'
import { CloudinaryMediaBrowser } from './cloudinary-media-browser'
import { CloudinaryUploadWidget } from './cloudinary-upload-widget'

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

type EditArticleFormProps = {
  article: Article
  form: UseFormReturn<z.infer<typeof ArticleSchema>>
}

export function EditArticleForm({ article }: Omit<EditArticleFormProps, 'form'>) {
  const defaultSocialImage = getOGImageUrlForResource(article)
  const form = useForm<z.infer<typeof ArticleSchema>>({
    resolver: zodResolver(ArticleSchema),
    defaultValues: {
      ...article,
      description: article.description ?? '',
      socialImage: defaultSocialImage,
    },
  })

  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileEditArticleForm article={article} form={form} />
  ) : (
    <DesktopEditArticleForm article={article} form={form} />
  )
}

const DesktopEditArticleForm: React.FC<EditArticleFormProps> = ({ article, form }) => {
  const [feedbackMarkers, setFeedbackMarkers] = React.useState<FeedbackMarker[]>([])
  const router = useRouter()

  const { mutateAsync: updateArticle, status: updateArticleStatus } = api.articles.update.useMutation()

  const { mutateAsync: generateFeedback } = api.writing.generateFeedback.useMutation()

  useSocket({
    room: article._id,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)
        const invalidateOn = ['ai.feedback.markers.generated']

        if (invalidateOn.includes(data.name)) {
          setFeedbackMarkers(data.body)
        }
      } catch (error) {
        // noting to do
      }
    },
  })

  const onSubmit = async (values: z.infer<typeof ArticleSchema>) => {
    const updatedArticle = await updateArticle(values)
    if (updatedArticle) {
      router.push(`/${updatedArticle.slug}`)
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
            <Link href={`/${article.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Article <span className="hidden font-mono text-xs font-normal md:inline-block">({article._id})</span>
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
          disabled={updateArticleStatus === 'loading'}
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
                  <ArticleMetadataFormFields form={form} />
                </div>
              </ScrollArea>
            </form>
          </Form>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} className="min-h-[var(--pane-layout-height)] md:min-h-full">
          <ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
            <CodemirrorEditor
              roomName={`${article._id}`}
              value={article.body || ''}
              onChange={async (data) => {
                form.setValue('body', data)
                await generateFeedback({
                  resourceId: article._id,
                  body: data,
                  currentFeedback: feedbackMarkers,
                })
              }}
              markers={feedbackMarkers}
            />
            {/* <FormMessage /> */}
            <div>
              <ul>
                {feedbackMarkers.map((marker) => {
                  return (
                    <li
                      key={marker.originalText}
                    >{`${marker.level}: ${marker.originalText} -> ${marker.fullSuggestedChange} [${marker.feedback}]`}</li>
                  )
                })}
              </ul>
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          className="h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:min-h-full"
          minSize={15}
          defaultSize={25}
          maxSize={50}
        >
          {watcher && activeWidget.id === 'assistant' && (
            <ArticleAssistant article={{ ...article, ...formValues }} currentFeedback={feedbackMarkers} />
          )}
          {activeWidget.id === 'media' && (
            <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
              <CloudinaryUploadWidget dir={article._type} id={article._id} />
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

const MobileEditArticleForm: React.FC<EditArticleFormProps> = ({ article, form }) => {
  const router = useRouter()
  const [feedbackMarkers, setFeedbackMarkers] = React.useState<FeedbackMarker[]>([])
  const [activeWidget, setActiveWidget] = React.useState(WIDGETS.values().next().value)

  const { mutateAsync: updateArticle, status: updateArticleStatus } = api.articles.update.useMutation()
  const { mutateAsync: generateFeedback } = api.writing.generateFeedback.useMutation()

  useSocket({
    room: article._id,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)
        const invalidateOn = ['ai.feedback.markers.generated']

        if (invalidateOn.includes(data.name)) {
          setFeedbackMarkers(data.body)
        }
      } catch (error) {
        // nothing to do
      }
    },
  })

  const onSubmit = async (values: z.infer<typeof ArticleSchema>) => {
    const updatedArticle = await updateArticle(values)
    if (updatedArticle) {
      router.push(`/${updatedArticle.slug}`)
    }
  }

  const formValues = form.getValues()

  return (
    <>
      <div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/${article.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Article <span className="hidden font-mono text-xs font-normal md:inline-block">({article._id})</span>
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
          disabled={updateArticleStatus === 'loading'}
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
            <ArticleMetadataFormFields form={form} />
          </div>
        </form>
      </Form>
      <label className="px-5 text-lg font-bold">Content</label>
      <CodemirrorEditor
        roomName={`${article._id}`}
        value={article.body || ''}
        onChange={async (data) => {
          form.setValue('body', data)
          await generateFeedback({
            resourceId: article._id,
            body: data,
            currentFeedback: feedbackMarkers,
          })
        }}
        markers={feedbackMarkers}
      />
    </>
  )
}

const ArticleMetadataFormFields = ({ form }: { form: UseFormReturn<z.infer<typeof ArticleSchema>> }) => {
  const currentSocialImage = form.watch('socialImage')
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
                {ArticleVisibilitySchema.options.map((option) => {
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
      <FormField
        control={form.control}
        name="socialImage"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel>Social Image</FormLabel>
            <FormDescription>Used as a preview image on Twitter cards etc.</FormDescription>
            {currentSocialImage && (
              <img
                alt={`social image preview`}
                width={1200 / 2}
                height={630 / 2}
                className="aspect-[1200/630] rounded-md border"
                src={currentSocialImage.toString()}
              />
            )}
            <div className="flex items-center gap-1">
              <Input {...field} value={field.value?.toString()} type="hidden" />
            </div>
          </FormItem>
        )}
      />
    </>
  )
}
