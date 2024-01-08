import {CardTitle, CardHeader, CardContent, Card} from '@coursebuilder/ui'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import * as React from 'react'
import Link from 'next/link'
import {sanityQuery} from '@/server/sanity.server'

export default async function ArticlesIndexPage() {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})
  const articles = await sanityQuery<
    {
      _id: string
      title: string
      slug: string
    }[]
  >(`*[_type == "article"]{
    _id,
    title,
    "slug": slug.current,
  }`)

  return (
    <div className="grid h-full flex-grow grid-cols-5 gap-3 bg-muted p-5">
      <div className="col-span-3 flex h-full flex-grow flex-col space-y-2">
        <h2 className="text-lg font-bold">Articles</h2>
        {articles.map((article) => (
          <Card key={article._id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/${article.slug || article._id}`}>
                  {article.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
