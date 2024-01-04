import {CardTitle, CardHeader, CardContent, Card} from '@coursebuilder/ui'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {CreateTip} from '@/app/tips/_components/create-tip'
import {getTipsModule} from '@/lib/tips'
import * as React from 'react'
import Link from 'next/link'

export default async function TipsListPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tipsModule = await getTipsModule()

  return (
    <div className="grid h-full flex-grow grid-cols-5 gap-3 bg-muted p-5">
      <div className="col-span-3 flex h-full flex-grow flex-col space-y-2">
        <h2 className="text-lg font-bold">Published Tips</h2>
        {tipsModule.tips.map((tip) => (
          <Card key={tip._id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/tips/${tip.slug || tip._id}`}>{tip.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tip.summary}
              {tip.body}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="col-span-2 h-full flex-grow">
        <h1 className="pb-2 text-lg font-bold">Create Tip</h1>
        {ability.can('create', 'Content') ? <CreateTip /> : null}
      </div>
    </div>
  )
}
