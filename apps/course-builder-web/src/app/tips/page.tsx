import {CardTitle, CardHeader, CardContent, Card} from '@/components/ui/card'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {CreateTip} from '@/app/tips/_components/create-tip'
import {getTipsModule} from '@/lib/tips'
import * as React from 'react'
import {TipPlayer} from '@/app/tips/_components/tip-player'
import {Button} from '@/components/ui/button'
import {inngest} from '@/inngest/inngest.server'
import {AI_TIP_WRITING_REQUESTED_EVENT} from '@/inngest/events'
import {Textarea} from '@/components/ui/textarea'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import Link from 'next/link'

export default async function TipsListPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tipsModule = await getTipsModule()

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? <CreateTip /> : null}
      <div className="mt-2">
        <h3 className="text-lg font-bold">Published Tips</h3>
        {tipsModule.tips.map((tip) => (
          <Card key={tip._id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/tips/${tip.slug || tip._id}`}>{tip.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tip.summary}
              <TipPlayer
                videoResourceId={tip.videoResourceId}
                muxPlaybackId={tip.muxPlaybackId}
              />
              {tip.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
