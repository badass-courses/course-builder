'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CodemirrorEditor } from '@/app/_components/codemirror'
import { useSocket } from '@/hooks/use-socket'
import { Article, ArticleSchema, ArticleVisibilitySchema } from '@/lib/articles'
import { FeedbackMarker } from '@/lib/feedback-marker'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlusIcon, ZapIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
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

export function EditArticleForm({ article }: { article: Article }) {
  const [feedbackMarkers, setFeedbackMarkers] = React.useState<FeedbackMarker[]>([])
  const router = useRouter()
  const defaultSocialImage = getOGImageUrlForResource(article)

  const form = useForm<z.infer<typeof ArticleSchema>>({
    resolver: zodResolver(ArticleSchema),
    defaultValues: {
      ...article,
      description: article.description ?? '',
      socialImage: defaultSocialImage,
    },
  })

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

  const [activeToolbarTab, setActiveToolbarTab] = React.useState(TOOLBAR.values().next().value)

  const formValues = form.getValues()

  const watcher = form.watch(['title', 'body'])

  const currentSocialImage = form.watch('socialImage')

  return (
    <Form {...form}>
      <form
        className="relative flex h-full flex-grow flex-col"
        onSubmit={form.handleSubmit(onSubmit, (error) => {
          console.log({ error })
        })}
      >
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
            type="submit"
            variant="default"
            size="sm"
            className="h-7"
            disabled={updateArticleStatus === 'loading'}
          >
            Save
          </Button>
        </div>
        <div className="flex h-full flex-grow flex-col border-t md:flex-row">
          <div className="grid-cols-12 md:grid">
            <div className="col-span-3 flex flex-col gap-5 py-5 md:h-full md:border-r">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="px-5">
                    <FormLabel>Title</FormLabel>
                    <FormDescription>
                      A title should summarize the tip and explain what it is about clearly.
                    </FormDescription>
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
                        alt={`social image preview for ${article.title}`}
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
            </div>
            <div className="col-span-6 flex w-full flex-col justify-start space-y-5 border-r md:h-full">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="pt-5">
                    <FormLabel className="px-5 text-lg font-bold">Content</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <div className="col-span-3">
              {watcher && activeToolbarTab.id === 'assistant' && (
                <ArticleAssistant article={{ ...article, ...formValues }} currentFeedback={feedbackMarkers} />
              )}
              {activeToolbarTab.id === 'media' && (
                <>
                  <CloudinaryUploadWidget dir={article._type} id={article._id} />
                  <CloudinaryMediaBrowser />
                </>
              )}
            </div>
          </div>
          <div className="bg-muted relative border-l">
            <div className="flex flex-col gap-1 p-1">
              <TooltipProvider delayDuration={0}>
                {Array.from(TOOLBAR).map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        type="button"
                        className={cn(
                          `hover:bg-background/50 flex aspect-square items-center justify-center rounded-lg border p-0 transition`,
                          {
                            'border-border bg-background': activeToolbarTab.id === item.id,
                            'border-transparent bg-transparent': activeToolbarTab.id !== item.id,
                          },
                        )}
                        onClick={() => setActiveToolbarTab(item)}
                      >
                        {item.icon()}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="capitalize">
                      {item.id}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}

const TOOLBAR = new Set([
  {
    id: 'assistant',
    icon: () => <ZapIcon strokeWidth={1.5} size={24} width={18} height={18} />,
  },
  {
    id: 'media',
    icon: () => <ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />,
  },
])
