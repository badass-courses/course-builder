import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {getTip} from '@/lib/tips'
import {Card, CardContent, CardFooter, CardHeader} from '@coursebuilder/ui'
import {EditTipForm} from '../../_components/edit-tip-form'
import {TipPlayer} from '@/app/tips/_components/tip-player'
import {SuggestionResults} from '@/app/tips/[slug]/edit/suggestion-results'

export default async function TipEditPage({params}: {params: {slug: string}}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tip = await getTip(params.slug)

  return tip && ability.can('upload', 'Media') ? (
    <div className="flex space-x-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <svg
            className=" h-4 w-4 text-zinc-500 dark:text-zinc-400"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
        </CardHeader>
        <CardContent>
          <EditTipForm key={tip.slug} tip={tip} />
          <SuggestionResults videoResourceId={tip.videoResourceId} />
        </CardContent>
        <CardFooter></CardFooter>
      </Card>

      <TipPlayer
        videoResourceId={tip.videoResourceId}
        muxPlaybackId={tip.muxPlaybackId}
      />
    </div>
  ) : null
}
