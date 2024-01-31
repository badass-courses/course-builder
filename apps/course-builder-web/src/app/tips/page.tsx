import * as React from 'react'
import Link from 'next/link'
import { CreateTip } from '@/app/tips/_components/create-tip'
import { getAbility } from '@/lib/ability'
import { getTipsModule } from '@/lib/tips'
import { getServerAuthSession } from '@/server/auth'
import ReactMarkdown from 'react-markdown'

import { Card, CardContent, CardHeader, CardTitle } from '@coursebuilder/ui'

export default async function TipsListPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tipsModule = await getTipsModule()

  return (
    <div className="bg-muted flex h-full flex-grow flex-col-reverse gap-3 p-5 md:flex-row">
      <div className="flex h-full flex-grow flex-col space-y-2 md:order-2">
        <h2 className="text-lg font-bold">Published Tips</h2>
        {tipsModule.tips.map((tip) => (
          <Card key={tip._id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/tips/${tip.slug || tip._id}`}>{tip.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactMarkdown className="prose dark:prose-invert">{tip.summary ?? tip.body}</ReactMarkdown>
            </CardContent>
          </Card>
        ))}
      </div>
      {ability.can('create', 'Content') ? (
        <div className="order-1 h-full flex-grow md:order-2">
          <h1 className="pb-2 text-lg font-bold">Create Tip</h1>
          <CreateTip />
        </div>
      ) : null}
    </div>
  )
}
