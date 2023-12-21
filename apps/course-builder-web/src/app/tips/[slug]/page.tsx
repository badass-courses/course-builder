import Link from 'next/link'
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  Button,
} from '@coursebuilder/ui'
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
    <div>
      {ability.can('edit', 'Tip') ? (
        <div className="flex h-9 w-full items-center justify-between bg-muted px-1">
          <div />
          <Button asChild className="h-7">
            <Link href={`/tips/${tip.slug || tip._id}/edit`}>Edit</Link>
          </Button>
        </div>
      ) : null}
      <header>
        <TipPlayer
          videoResourceId={tip.videoResourceId}
          muxPlaybackId={tip.muxPlaybackId}
          className="relative flex h-full max-h-[calc(100vh-var(--nav-height))] w-full items-center justify-center"
        />
      </header>
      <article className="grid grid-cols-5 p-5 sm:p-10">
        <div className="col-span-3">
          <h1 className="text-3xl font-bold">{tip.title}</h1>
        </div>
        <div className="col-span-2">
          <ReactMarkdown className="prose dark:prose-invert">
            {tip.body}
          </ReactMarkdown>
          <ReactMarkdown>{tip.summary}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
