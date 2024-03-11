'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { NewPrompt, NewPromptSchema } from '@/lib/prompts'
import { createPrompt } from '@/lib/prompts-query'
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

export function NewPromptForm() {
  const router = useRouter()

  const form = useForm<NewPrompt>({
    resolver: zodResolver(NewPromptSchema),
    defaultValues: {
      title: '',
    },
  })

  const onSubmit = async (values: NewPrompt) => {
    form.reset()
    const prompt = await createPrompt(values)
    if (prompt) {
      router.push(`/prompts/${prompt.slug}/edit`)
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
                A title should summarize the prompt and explain what it is about clearly.
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
          Create Draft Prompt
        </Button>
      </form>
    </Form>
  )
}
