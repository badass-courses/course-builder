'use client'

import * as React from 'react'
import {TipPlayer} from '@/app/tips/_components/tip-player'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Textarea,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  const {mutateAsync: updateTip} = api.tips.update.useMutation()

  const onSubmit = async (values: z.infer<typeof NewTipFormSchema>) => {
    const {slug} = await updateTip({tipId: tip._id, ...values})
    router.push(`/tips/${slug}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex w-full items-center justify-between bg-gray-100 px-5 py-3">
          <Button className="px-0" asChild variant="link">
            <Link href={`/tips/${tip.slug}`}>← Tip</Link>
          </Button>
          <Button type="submit" variant="default">
            Save Tip
          </Button>
        </div>
        <div className="grid grid-cols-12">
          <div className="col-span-3 flex h-full flex-col space-y-5 border-r p-5">
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
          <div className="col-span-6 flex flex-col space-y-5 border-r p-5">
            <FormField
              control={form.control}
              name="body"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-lg font-bold">Content</FormLabel>
                  <FormDescription>Tip content in MDX.</FormDescription>
                  <Textarea
                    className="text-base leading-relaxed"
                    rows={21}
                    {...field}
                    value={field.value || ''}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Accordion type="single" collapsible>
              <AccordionItem value="video" className="rounded border">
                <AccordionTrigger className="flex w-full justify-between px-5 py-3 text-lg font-bold">
                  Video
                </AccordionTrigger>
                <AccordionContent>
                  <TipPlayer
                    videoResourceId={tip.videoResourceId}
                    muxPlaybackId={tip.muxPlaybackId}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="col-span-3">
            <TipAssistant tip={tip} />
          </div>
        </div>
      </form>
    </Form>
  )
}
