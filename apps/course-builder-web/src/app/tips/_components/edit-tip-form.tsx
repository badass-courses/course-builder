'use client'

import * as React from 'react'
import {TipPlayer} from '@/app/tips/_components/tip-player'
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
import {type Tip} from '@/lib/tips'
import {TipAssistant} from './tip-assistant'
import Link from 'next/link'
import {CodemirrorEditor} from '@/app/tips/_components/codemirror'
import {ImagePlusIcon, ZapIcon} from 'lucide-react'

const NewTipFormSchema = z.object({
  title: z.string().min(2).max(90),
  body: z.string().optional().nullable(),
})

export function EditTipForm({tip}: {tip: Tip}) {
  const router = useRouter()

  const form = useForm<z.infer<typeof NewTipFormSchema>>({
    resolver: zodResolver(NewTipFormSchema),
    defaultValues: {
      title: tip.title,
      body: tip.body,
    },
  })
  const {mutateAsync: updateTip, status: updateTipStatus} =
    api.tips.update.useMutation()

  const onSubmit = async (values: z.infer<typeof NewTipFormSchema>) => {
    const {slug} = await updateTip({tipId: tip._id, ...values})
    router.push(`/tips/${slug}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex w-full items-center justify-between bg-gray-100 p-2">
          <Button className="px-0" asChild variant="link">
            <Link href={`/tips/${tip.slug}`}>← Tip</Link>
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={updateTipStatus === 'loading'}
          >
            Save Tip
          </Button>
        </div>
        <div className="flex h-full border-t">
          <div className="grid grid-cols-12">
            <div className="col-span-3 flex h-full flex-col space-y-5 border-r p-5">
              <TipPlayer
                videoResourceId={tip.videoResourceId}
                muxPlaybackId={tip.muxPlaybackId}
              />
              <FormField
                control={form.control}
                name="title"
                render={({field}) => (
                  <FormItem>
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
            </div>
            <div className="col-span-6 flex h-full w-full flex-col justify-start space-y-5 border-r">
              <FormField
                control={form.control}
                name="body"
                render={({field}) => (
                  <FormItem className="h-full pt-5">
                    <FormLabel className="px-5 text-lg font-bold">
                      Content
                    </FormLabel>
                    <FormDescription className="px-5 pb-3">
                      Tip content in MDX.
                    </FormDescription>
                    <CodemirrorEditor roomName={`tip-edit-${tip._id}`} />
                    {/*<Textarea*/}
                    {/*  className="text-base leading-relaxed"*/}
                    {/*  rows={21}*/}
                    {/*  {...field}*/}
                    {/*  value={field.value || ''}*/}
                    {/*/>*/}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-3">
              <TipAssistant tip={tip} />
            </div>
          </div>
          <div className="border-l bg-gray-100">
            <div className="flex flex-col gap-1 p-1">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      type="button"
                      className="flex aspect-square items-center justify-center rounded-lg border bg-background p-2"
                    >
                      <ZapIcon
                        strokeWidth={1.5}
                        size={24}
                        width={18}
                        height={18}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Assistant</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="link"
                      type="button"
                      className="flex aspect-square items-center justify-center rounded-lg border border-transparent p-2 transition hover:bg-background/50"
                    >
                      <ImagePlusIcon
                        strokeWidth={1.5}
                        size={24}
                        width={18}
                        height={18}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Media</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
