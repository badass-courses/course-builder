'use client'

import * as React from 'react'
import {Button} from '@coursebuilder/ui'
import {
  Form,
  FormControl,
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

const NewArticleFormSchema = z.object({
  title: z.string().min(2).max(90),
})

export function NewArticleForm() {
  const router = useRouter()

  const form = useForm<z.infer<typeof NewArticleFormSchema>>({
    resolver: zodResolver(NewArticleFormSchema),
    defaultValues: {
      title: '',
    },
  })
  const {mutateAsync: createArticle} = api.articles.create.useMutation({
    onSuccess: async () => {
      form.reset()
      router.refresh()
    },
  })

  const onSubmit = async (values: z.infer<typeof NewArticleFormSchema>) => {
    const article = await createArticle(values)
    if (article) {
      router.push(`/${article.slug}/edit`)
    }
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
                A title should summarize the article and explain what it is
                about clearly.
              </FormDescription>
              <FormControl>
                <Input {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-2"
          variant="default"
          disabled={!form.formState.isValid}
        >
          Create Draft Article
        </Button>
      </form>
    </Form>
  )
}
