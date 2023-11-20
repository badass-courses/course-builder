import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {inngest} from '@/inngest/inngest.server'
import {AI_TIP_WRITING_REQUESTED_EVENT} from '@/inngest/events'
import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'

export default async function TipEditPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  return (
    <div className="flex flex-col">
      {tip && ability.can('upload', 'Media') ? (
        <div className="flex flex-col">
          <form
            className="flex flex-col space-y-2"
            action={async (data) => {
              'use server'
              console.log('submit', {data})
            }}
          >
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              defaultValue={tip.title}
              type="text"
              placeholder="Title"
            />
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              rows={10}
              defaultValue={tip.summary}
              placeholder="Summary"
            />
            <Label htmlFor="Description">Description</Label>
            <Textarea
              id="description"
              rows={10}
              defaultValue={tip.body}
              placeholder="Description"
            />
            <Button type="submit">Save Tip</Button>
          </form>
          <div className="flex">
            <form
              action={async (data) => {
                'use server'
                await inngest.send({
                  name: AI_TIP_WRITING_REQUESTED_EVENT,
                  data: {
                    tipId: tip._id,
                  },
                })
              }}
            >
              <Button type="submit">Re-Generate Title</Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
