'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { NewArticle, NewArticleSchema } from '@/lib/articles'
import { createArticle } from '@/lib/articles-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

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
} from '@coursebuilder/ui'

export function NewArticleForm() {
  const router = useRouter()

  const form = useForm<NewArticle>({
    resolver: zodResolver(NewArticleSchema),
    defaultValues: {
      title: '',
    },
  })

  const onSubmit = async (values: NewArticle) => {
    form.reset()
    const article = await createArticle(values)
    if (article) {
      router.push(`/articles/${article.slug}/edit`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-bold">Title</FormLabel>
              <FormDescription className="mt-2 text-sm">
                A title should summarize the article and explain what it is about clearly.
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
          disabled={(form.formState.isDirty && !form.formState.isValid) || form.formState.isSubmitting}
        >
          Create Draft Article
        </Button>
      </form>
    </Form>
  )
}
