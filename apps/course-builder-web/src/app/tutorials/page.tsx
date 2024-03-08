import * as React from 'react'
import Link from 'next/link'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'

import { Card, CardContent, CardHeader, CardTitle } from '@coursebuilder/ui'

export default async function Tutorials() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tutorials: any[] = []

  return (
    <div className="flex flex-col">
      {ability.can('create', 'Content') ? <Link href="/tutorials/new">New Tutorial</Link> : null}
      {tutorials.map((tutorial) => (
        <Link href={`/tutorials/${tutorial.slug}`} key={tutorial._id}>
          <Card>
            <CardHeader>
              <CardTitle>{tutorial.title}</CardTitle>
            </CardHeader>
            <CardContent>{tutorial.description}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
