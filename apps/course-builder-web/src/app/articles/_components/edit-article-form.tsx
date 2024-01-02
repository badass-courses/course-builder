'use client'

import * as React from 'react'
import {
  Button,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@coursebuilder/ui'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {Input} from '@coursebuilder/ui'
import {api} from '@/trpc/react'
import {useRouter} from 'next/navigation'
import {ArticleAssistant} from './article-assistant'
import Link from 'next/link'
import {CodemirrorEditor} from './codemirror'
import {ImagePlusIcon, ZapIcon} from 'lucide-react'
import {CloudinaryUploadWidget} from './cloudinary-upload-widget'
import {CloudinaryMediaBrowser} from './cloudinary-media-browser'
import {cn} from '@/lib/utils'
import {Article} from '@/lib/articles'

const ArticleFormSchema = z.object({
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
})

export function EditArticleForm({article}: {article: Article}) {
  const router = useRouter()

  const form = useForm<z.infer<typeof ArticleFormSchema>>({
    resolver: zodResolver(ArticleFormSchema),
    defaultValues: {
      title: article.title,
      body: article.body,
    },
  })
  const {mutateAsync: updateArticle, status: updateArticleStatus} =
    api.articles.update.useMutation()

  const onSubmit = async (values: z.infer<typeof ArticleFormSchema>) => {
    const updatedArticle = await updateArticle({
      articleId: article._id,
      ...values,
    })
    if (updatedArticle) {
      router.push(`/${updatedArticle.slug}`)
    }
  }

  const [activeToolbarTab, setActiveToolbarTab] = React.useState(
    TOOLBAR.values().next().value,
  )

  const formValues = form.getValues()

  const watcher = form.watch(['title', 'body'])

  return (
    <Form {...form}>
      <form
        className="flex h-full flex-grow flex-col"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex h-9 w-full items-center justify-between bg-muted px-1">
          <Button className="px-0" asChild variant="link">
            <Link href={`/${article.slug}`} className="aspect-square">
              ←
            </Link>
          </Button>
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
        <div className="flex h-full flex-grow border-t">
          <div className="grid grid-cols-12">
            <div className="col-span-3 flex h-full flex-col border-r">
              <FormField
                control={form.control}
                name="title"
                render={({field}) => (
                  <FormItem className="p-5">
                    <FormLabel className="text-lg font-bold">Title</FormLabel>
                    <FormDescription>
                      A title should summarize the tip and explain what it is
                      about clearly.
                    </FormDescription>
                    <Input {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex max-h-screen items-end p-5 text-xs text-orange-600">
                {article._id}
              </div>
            </div>
            <div className="col-span-6 flex h-full w-full flex-col justify-start space-y-5 border-r">
              <FormField
                control={form.control}
                name="body"
                render={({field}) => (
                  <FormItem className="pt-5">
                    <FormLabel className="px-5 text-lg font-bold">
                      Content
                    </FormLabel>
                    <FormDescription className="px-5 pb-3">
                      Tip content in MDX.
                    </FormDescription>
                    <CodemirrorEditor
                      roomName={`${article._id}`}
                      value={article.body}
                      onChange={(data) => {
                        form.setValue('body', data)
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-3">
              {watcher && activeToolbarTab.id === 'assistant' && (
                <ArticleAssistant article={{...article, ...formValues}} />
              )}
              {activeToolbarTab.id === 'media' && (
                <>
                  <CloudinaryUploadWidget
                    dir={article._type}
                    id={article._id}
                  />
                  <CloudinaryMediaBrowser />
                </>
              )}
            </div>
          </div>
          <div className="border-l bg-muted">
            <div className="flex flex-col gap-1 p-1">
              <TooltipProvider delayDuration={0}>
                {Array.from(TOOLBAR).map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="link"
                        type="button"
                        className={cn(
                          `flex aspect-square items-center justify-center rounded-lg border p-0 transition hover:bg-background/50`,
                          {
                            'border-border bg-background':
                              activeToolbarTab.id === item.id,
                            'border-transparent bg-transparent':
                              activeToolbarTab.id !== item.id,
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
    icon: () => (
      <ImagePlusIcon strokeWidth={1.5} size={24} width={18} height={18} />
    ),
  },
])
