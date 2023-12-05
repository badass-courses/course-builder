import {sanityQuery} from '@/server/sanity.server'
import {Card, CardContent, CardHeader, CardTitle} from '@coursebuilder/ui'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import * as React from 'react'
import Link from 'next/link'

export default async function Tutorials() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const tutorials = await sanityQuery<
    {
      _id: string
      title: string
      description: string
      slug: string
    }[]
  >(`*[_type == "module" && moduleType == "tutorial"]{
    _id, 
    title, 
    description, 
    "slug": slug.current
    }`)

  return (
    <div className="flex flex-col">
      {ability.can('upload', 'Media') ? (
        <Link href="/tutorials/new">New Tutorial</Link>
      ) : null}
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
