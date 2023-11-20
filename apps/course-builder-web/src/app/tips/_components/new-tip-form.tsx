'use client'

import * as React from 'react'
import {TipUploader} from '@/app/tips/_components/tip-uploader'
import {Button} from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {useForm} from 'react-hook-form'
import {Textarea} from '@/components/ui/textarea'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {Input} from '@/components/ui/input'
import {api} from '@/trpc/react'
import {useRouter} from 'next/navigation'

const NewTipFormSchema = z.object({
  description: z.string().max(240).optional(),
  videoResourceId: z.string().min(4, 'Please upload a video'),
})

export function NewTipForm() {
  const [videoResourceId, setVideoResourceId] = React.useState<string>('')
  const router = useRouter()

  const form = useForm<z.infer<typeof NewTipFormSchema>>({
    resolver: zodResolver(NewTipFormSchema),
    defaultValues: {
      description: '',
      videoResourceId: '',
    },
  })
  const utils = api.useUtils()
  const {mutateAsync: createTip} = api.tips.create.useMutation({
    onSuccess: async (data) => {
      console.log('onSuccess', {data})
      form.reset()
      setVideoResourceId('')
      form.setValue('videoResourceId', '')
      await utils.module.getBySlug.invalidate()
      router.refresh()
    },
  })

  const onSubmit = async (values: z.infer<typeof NewTipFormSchema>) => {
    const tip = await createTip(values)
    router.push(`/tips/${tip.slug}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-lg font-bold">
                Enter your tip summary here
              </FormLabel>
              <FormDescription className="mt-2 text-sm">
                Your summary will be used to generate the title and draft body
                text based on the transcript of the video.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="describe the tip like a tweet :)"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="videoResourceId"
          render={({field}) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {videoResourceId.length === 0 ? (
          <TipUploader
            setVideoResourceId={(videoResourceId: string) => {
              form.setValue('videoResourceId', videoResourceId)
              setVideoResourceId(videoResourceId)
            }}
          />
        ) : (
          <div>
            {videoResourceId}{' '}
            <Button
              onClick={() => {
                setVideoResourceId('')
                form.setValue('videoResourceId', '')
              }}
            >
              clear
            </Button>
          </div>
        )}

        <Button type="submit" className="mt-2" variant="default">
          Submit Tip
        </Button>
      </form>
    </Form>
  )
}
