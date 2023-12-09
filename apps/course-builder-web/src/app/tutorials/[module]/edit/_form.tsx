'use client'

import SortableLessonList, {ItemData} from '@/components/lesson-list/list'
import VideoUploader from '@/components/video-uploader'
import * as React from 'react'
import {api} from '@/trpc/react'
import {Controller, useFieldArray, useForm} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@coursebuilder/ui'

const EditTutorialFormSchema = z.object({
  title: z.string().min(2).max(90),
  description: z.string().optional(),
  lessons: z.array(
    z.object({
      _id: z.string(),
      title: z.string().min(2).max(90),
    }),
  ),
})

export function EditTutorialForm({
  moduleSlug,
  initialTutorialData,
}: {
  moduleSlug: string
  initialTutorialData: {
    title: string
    description: string
    lessons: {_id: string; title: string}[]
  }
}) {
  const form = useForm<z.infer<typeof EditTutorialFormSchema>>({
    resolver: zodResolver(EditTutorialFormSchema),
    defaultValues: initialTutorialData,
  })

  const {data: tutorial, status: tutorialStatus} =
    api.module.getTutorial.useQuery({
      slug: moduleSlug,
    })

  const {fields, replace, move} = useFieldArray({
    control: form.control,
    name: 'lessons',
  })

  const handleMove = (from: number, to: number) => {
    move(from, to)
  }

  const onSubmit = async (values: z.infer<typeof EditTutorialFormSchema>) => {
    console.log(values)
  }

  const handleOnChange = React.useCallback(
    (items: ItemData[]) => {
      const sortedLessons: any[] = []

      if (tutorial?.lessons) {
        items.forEach((lesson, index) => {
          const lessonIndex = tutorial.lessons.findIndex(
            (l) => l._id === lesson.id,
          )
          if (lessonIndex > -1) {
            sortedLessons.push(tutorial.lessons[lessonIndex])
          }
        })
      } else {
        replace(items.map((item) => ({_id: item.id, title: item.label})))
      }

      replace(sortedLessons)
    },
    [tutorial, replace],
  )

  return tutorialStatus === 'success' ? (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id}>
              <Input name={`lessons.${index}.title`} type="hidden" {...field} />
            </div>
          ))}
          <div>Edit Tutorial Form</div>
          <FormField
            control={form.control}
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
            name="title"
          />
          <FormField
            control={form.control}
            render={({field}) => (
              <FormItem>
                <FormLabel className="text-lg font-bold">Description</FormLabel>
                <Textarea {...field} />
                <FormMessage />
              </FormItem>
            )}
            name="description"
          />

          <Button type="submit">Save Tutorial</Button>
        </form>
      </Form>
      <div className="flex flex-col">
        <div
          key={initialTutorialData.lessons.length}
          className="container h-full py-6"
        >
          {initialTutorialData?.lessons && (
            <SortableLessonList
              items={initialTutorialData?.lessons.map((lesson) => {
                return {
                  id: lesson._id,
                  label: lesson.title,
                }
              })}
              onChange={handleOnChange}
            />
          )}
        </div>
      </div>
    </>
  ) : null
}
