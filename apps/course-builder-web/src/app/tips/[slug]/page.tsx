import Link from 'next/link'
import {CardTitle, CardHeader, CardContent, Card} from '@coursebuilder/ui'
import {TipPlayer} from '@/app/tips/_components/tip-player'
import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'
import ReactMarkdown from 'react-markdown'

export default async function TipPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  return (
    <div className="flex flex-col">
      <Card key={tip._id}>
        <CardHeader>
          <CardTitle>{tip.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {tip.summary}
          <TipPlayer
            videoResourceId={tip.videoResourceId}
            muxPlaybackId={tip.muxPlaybackId}
          />
          <ReactMarkdown>{tip.body}</ReactMarkdown>
          {ability.can('edit', 'Tip') ? (
            <Link href={`/tips/${tip.slug || tip._id}/edit`}>edit</Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
