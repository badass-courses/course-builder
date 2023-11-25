'use client'

import * as React from 'react'
import {Button} from '@coursebuilder/ui'
import {
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

const NewTipFormSchema = z.object({
  title: z.string().min(2).max(90),
})

export function EditTipForm({tip}: {tip: Tip}) {
  const router = useRouter()

  const form = useForm<z.infer<typeof NewTipFormSchema>>({
    resolver: zodResolver(NewTipFormSchema),
    defaultValues: {
      title: tip.title,
    },
  })
  const {mutateAsync: updateTip} = api.tips.update.useMutation()
  const {mutateAsync: generateTitle} = api.tips.generateTitle.useMutation()

  const onSubmit = async (values: z.infer<typeof NewTipFormSchema>) => {
    const {slug} = await updateTip({tipId: tip._id, ...values})
    router.push(`/tips/${slug}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-lg font-bold">Title</FormLabel>
              <FormDescription className="mt-2 text-sm">
                A title should summarize the tip and explain what it is about
                clearly.
              </FormDescription>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex">
          <Button
            onClick={async (event) => {
              event.preventDefault()
              await generateTitle({tipId: tip._id})
            }}
          >
            Re-Generate Title
          </Button>
        </div>

        <Button type="submit" className="mt-2" variant="default">
          Save Tip
        </Button>
      </form>
    </Form>
  )
}
