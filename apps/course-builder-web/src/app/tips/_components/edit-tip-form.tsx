'use client'

import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { requestCodeExtraction } from '@/app/tips/_components/tip-form-actions'
import { TipPlayer } from '@/app/tips/_components/tip-player'
import { reprocessTranscript } from '@/app/tips/[slug]/edit/actions'
import { ResourceChatAssistant } from '@/components/chat-assistant/resource-chat-assistant'
import { CodemirrorEditor } from '@/components/codemirror'
import { CloudinaryUploadButton } from '@/components/image-uploader/cloudinary-upload-button'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { useSocket } from '@/hooks/use-socket'
import { TipSchema, TipUpdate, type Tip } from '@/lib/tips'
import { updateTip } from '@/lib/tips-query'
import { VideoResource } from '@/lib/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'
import { cn } from '@/utils/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, RefreshCcw, ZapIcon } from 'lucide-react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import { z } from 'zod'

import {
  Button,
  Form,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@coursebuilder/ui'
import { toast } from '@coursebuilder/ui/primitives/use-toast'

import { ImageResourceBrowser } from '../../../components/image-uploader/image-resource-browser'

const NewTipFormSchema = z.object({
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
})

type EditTipFormProps = {
  tip: Tip
  videoResourceLoader: Promise<VideoResource | null>
  transcriptWithScreenshotsLoader?: Promise<string | null>
  form: UseFormReturn<z.infer<typeof TipSchema>>
}

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

export function EditTipForm({
  tip,
  videoResourceLoader,
  transcriptWithScreenshotsLoader,
}: Omit<EditTipFormProps, 'form'>) {
  const form = useForm<z.infer<typeof TipSchema>>({
    resolver: zodResolver(NewTipFormSchema),
    defaultValues: {
      title: tip.title,
      body: tip.body,
    },
  })
  const isMobile = useIsMobile()

  return isMobile ? (
    <MobileEditTipForm tip={tip} form={form} videoResourceLoader={videoResourceLoader} />
  ) : (
    <DesktopEditTipForm
      tip={tip}
      form={form}
      videoResourceLoader={videoResourceLoader}
      transcriptWithScreenshotsLoader={transcriptWithScreenshotsLoader}
    />
  )
}

/**
 * Custom hook to poll for video resource transcript because sometimes
 * the timing is JUST right and the webhook gets missed so a poll helps
 * makes sure it's not stuck in a loading state
 * @param options
 */
function useTranscript(options: { videoResourceId: string | null | undefined; initialTranscript?: string | null }) {
  const [transcript, setTranscript] = React.useState<string | null>(options.initialTranscript || null)
  async function* pollVideoResourceTranscript(
    videoResourceId: string,
    maxAttempts = 30,
    initialDelay = 250,
    delayIncrement = 1000,
  ) {
    let delay = initialDelay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const videoResource = await getVideoResource(videoResourceId)
      if (videoResource?.transcript) {
        yield videoResource.transcript
        return
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
      delay += delayIncrement
    }

    throw new Error('Video resource not found after maximum attempts')
  }

  React.useEffect(() => {
    async function run() {
      try {
        if (options.videoResourceId) {
          const { value: transcript } = await pollVideoResourceTranscript(options.videoResourceId).next()
          if (transcript) {
            setTranscript(transcript)
          }
        }
      } catch (error) {
        console.error('Error polling video resource transcript:', error)
      }
    }

    if (!options.initialTranscript) {
      run()
    }
  }, [options.initialTranscript, options.videoResourceId])

  return [transcript, setTranscript] as const
}

const DesktopEditTipForm: React.FC<EditTipFormProps> = ({
  tip,
  form,
  videoResourceLoader,
  transcriptWithScreenshotsLoader,
}) => {
  const videoResource = use(videoResourceLoader)
  const initialTranscriptWithScreenshots = transcriptWithScreenshotsLoader ? use(transcriptWithScreenshotsLoader) : null

  const [transcriptWithScreenshots, setTranscriptWithScreenshots] = React.useState<string | null>(
    initialTranscriptWithScreenshots,
  )
  const [updateTipStatus, setUpdateTipStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const [videoResourceId, setVideoResourceId] = React.useState<string | null | undefined>(tip.videoResourceId)
  const router = useRouter()

  const [transcript, setTranscript] = useTranscript({ videoResourceId, initialTranscript: videoResource?.transcript })

  useSocket({
    room: tip._id,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)

        switch (data.name) {
          default:
            break
        }
      } catch (error) {
        // nothing to do
      }
    },
  })

  useSocket({
    room: videoResourceId,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)

        switch (data.name) {
          case 'video.asset.ready':
          case 'videoResource.created':
            if (data.body.id) {
              setVideoResourceId(data.body.id)
            }

            router.refresh()

            break
          case 'transcript.ready':
            setTranscript(data.body)
            break
          case 'transcriptWithScreenshots.ready':
            setTranscriptWithScreenshots(data.body)
            break
          default:
            break
        }
      } catch (error) {
        // nothing to do
      }
    },
  })

  const onSubmit = async (values: z.infer<typeof TipSchema>) => {
    console.log({ values })
    const updatedTip = await updateTip({ ...values, _id: tip._id })
    setUpdateTipStatus('success')

    if (!updatedTip) {
      // handle edge case, e.g. toast an error message
      toast({ content: 'Failed to update tip' })
    } else {
      const { slug } = updatedTip

      router.push(`/tips/${slug}`)
    }
  }

  const formValues = form.getValues()

  const [activeWidget, setActiveWidget] = React.useState(WIDGETS.values().next().value)

  return (
    <>
      <div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/tips/${tip.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Tip <span className="hidden font-mono text-xs font-normal md:inline-block">({tip._id})</span>
          </span>
        </div>
        <Button
          onClick={(e) => {
            setUpdateTipStatus('loading')
            onSubmit(form.getValues())
          }}
          type="button"
          variant="default"
          size="sm"
          className="h-7 disabled:cursor-wait"
          disabled={updateTipStatus === 'loading'}
        >
          Save
        </Button>
      </div>
      <ResizablePanelGroup direction="horizontal" className="!flex-col border-t md:!flex-row">
        <ResizablePanel minSize={5} defaultSize={25} maxSize={35}>
          <Form {...form}>
            <form
              className="min-w-[280px]"
              onSubmit={form.handleSubmit(onSubmit, (error) => {
                console.log({ error })
              })}
            >
              <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
                <div className="flex flex-col gap-8">
                  <div>
                    <Suspense
                      fallback={
                        <>
                          <div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
                            video is loading
                          </div>
                        </>
                      }
                    >
                      <TipPlayer videoResourceLoader={videoResourceLoader} />
                      <div className="px-5 text-xs">video is {videoResource?.state}</div>
                    </Suspense>
                  </div>
                  <TipMetadataFormFields form={form} />
                  <div className="px-5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-lg font-bold">Transcript</label>
                      {Boolean(videoResourceId) && (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={async (event) => {
                                  event.preventDefault()
                                  await reprocessTranscript({ videoResourceId })
                                }}
                                title="Reprocess"
                              >
                                <RefreshCcw className="w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Reprocess Transcript</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <ReactMarkdown className="prose prose-sm dark:prose-invert before:from-background relative mt-3 h-48 max-w-none overflow-hidden before:absolute before:bottom-0 before:left-0 before:z-10 before:h-24 before:w-full before:bg-gradient-to-t before:to-transparent before:content-[''] md:h-auto md:before:h-0">
                      {transcript ? transcript : 'Transcript Processing'}
                    </ReactMarkdown>
                  </div>
                </div>
              </ScrollArea>
            </form>
          </Form>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} className="min-h-[var(--pane-layout-height)] md:min-h-full">
          <ScrollArea className="flex h-[var(--pane-layout-height)] w-full flex-col justify-start overflow-y-auto">
            <CodemirrorEditor
              roomName={`${tip._id}`}
              value={tip.body || ''}
              onChange={(data) => {
                console.log('\n\n\n\n\n******************', data)
                form.setValue('body', data)
              }}
            />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        {Boolean(transcriptWithScreenshots) && (
          <>
            <ResizablePanel
              defaultSize={20}
              minSize={1}
              maxSize={50}
              collapsible={true}
              collapsedSize={1}
              className="hidden h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:flex md:min-h-full"
            >
              <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
                <div className="p-5">
                  <ReactMarkdown
                    className="prose dark:prose-invert prose-sm"
                    components={{
                      img: (props) => {
                        if (!props.src) return null

                        return (
                          <>
                            <a href={props.src} target="_blank" rel="noreferrer">
                              <Image
                                src={props.src}
                                alt={'screenshot'}
                                width={1960}
                                height={1080}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', `![](${e.currentTarget.src})`)
                                }}
                              />
                            </a>
                            <Button
                              size="sm"
                              onClick={() => {
                                const screenshotUrl = new URL(props.src as string)
                                screenshotUrl.searchParams.set('width', '1920')
                                screenshotUrl.searchParams.set('height', '1080')
                                requestCodeExtraction({ imageUrl: screenshotUrl.toString(), resourceId: tip._id })
                              }}
                            >
                              Get Code Text
                            </Button>
                          </>
                        )
                      },
                    }}
                  >
                    {transcriptWithScreenshots}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel
          className="h-[var(--pane-layout-height)] min-h-[var(--pane-layout-height)] md:min-h-full"
          minSize={15}
          defaultSize={25}
          maxSize={50}
        >
          {activeWidget.id === 'assistant' && <ResourceChatAssistant resource={{ ...tip, ...formValues }} />}
          {activeWidget.id === 'media' && (
            <ScrollArea className="h-[var(--pane-layout-height)] overflow-y-auto">
              <CloudinaryUploadButton dir={tip._type} id={tip._id} />
              <ImageResourceBrowser />
            </ScrollArea>
          )}
        </ResizablePanel>
        <div className="bg-muted h-12 w-full border-l md:h-[var(--pane-layout-height)] md:w-12">
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

const MobileEditTipForm: React.FC<EditTipFormProps> = ({
  tip,
  form,
  videoResourceLoader,
  transcriptWithScreenshotsLoader,
}) => {
  const videoResource = use(videoResourceLoader)
  const [updateTipStatus, setUpdateTipStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [transcript, setTranscript] = React.useState<string | null>(videoResource?.transcript || null)
  const [videoResourceId, setVideoResourceId] = React.useState<string | null | undefined>(tip.videoResourceId)
  const router = useRouter()

  useSocket({
    room: videoResourceId,
    onMessage: async (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)

        switch (data.name) {
          case 'video.asset.ready':
          case 'videoResource.created':
            if (data.body.id) {
              setVideoResourceId(data.body.id)
            }

            router.refresh()

            break
          case 'transcript.ready':
            setTranscript(data.body)
            break

          default:
            break
        }
      } catch (error) {
        // nothing to do
      }
    },
  })

  const onSubmit = async (values: TipUpdate) => {
    const updatedTip = await updateTip({ ...values, _id: tip._id })
    setUpdateTipStatus('success')

    if (!updatedTip) {
      // handle edge case, e.g. toast an error message
    } else {
      const { slug } = updatedTip

      router.push(`/tips/${slug}`)
    }
  }

  const formValues = form.getValues()

  return (
    <>
      <div className="md:bg-muted bg-muted/60 sticky top-0 z-10 flex h-9 w-full items-center justify-between px-1 backdrop-blur-md md:backdrop-blur-none">
        <div className="flex items-center gap-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/tips/${tip.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
          <span className="font-medium">
            Tip <span className="hidden font-mono text-xs font-normal md:inline-block">({tip._id})</span>
          </span>
        </div>
        <Button
          onClick={(e) => {
            setUpdateTipStatus('loading')
            onSubmit(form.getValues())
          }}
          type="button"
          size="sm"
          className="disabled:cursor-wait"
          disabled={updateTipStatus === 'loading'}
        >
          Save
        </Button>
      </div>
      <div className="flex flex-col">
        <Form {...form}>
          <form
            className="w-full"
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log({ error })
            })}
          >
            <div className="flex flex-col gap-8">
              <div>
                <Suspense
                  fallback={
                    <>
                      <div className="bg-muted flex aspect-video h-full w-full items-center justify-center p-5">
                        video is loading
                      </div>
                    </>
                  }
                >
                  <TipPlayer videoResourceLoader={videoResourceLoader} />
                  <div className="px-5 text-xs">video is {videoResource?.state}</div>
                </Suspense>
              </div>
              <TipMetadataFormFields form={form} />
              <div className="px-5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-lg font-bold">Transcript</label>
                  {Boolean(videoResourceId) && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={async (event) => {
                              event.preventDefault()
                              await reprocessTranscript({ videoResourceId })
                            }}
                            title="Reprocess"
                          >
                            <RefreshCcw className="w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Reprocess Transcript</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <ReactMarkdown className="prose prose-sm dark:prose-invert before:from-background relative mt-3 h-48 max-w-none overflow-hidden before:absolute before:bottom-0 before:left-0 before:z-10 before:h-24 before:w-full before:bg-gradient-to-t before:to-transparent before:content-[''] md:h-auto md:before:h-0">
                  {transcript ? transcript : 'Transcript Processing'}
                </ReactMarkdown>
              </div>
            </div>
          </form>
        </Form>
        <div className="pt-5">
          <label className="px-5 text-lg font-bold">Content</label>
          <CodemirrorEditor
            roomName={`${tip._id}`}
            value={tip.body || ''}
            onChange={(data) => {
              form.setValue('body', data)
            }}
          />
        </div>
      </div>
    </>
  )
}

const TipMetadataFormFields: React.FC<{ form: UseFormReturn<z.infer<typeof TipSchema>> }> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="px-5">
            <FormLabel className="text-lg font-bold">Title</FormLabel>
            <FormDescription>A title should summarize the tip and explain what it is about clearly.</FormDescription>
            <Input {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
