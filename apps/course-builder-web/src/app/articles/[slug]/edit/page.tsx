import * as React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EditArticleForm } from '@/app/articles/_components/edit-article-form'
import { getAbility } from '@/lib/ability'
import { getArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function ArticleEditPage({ params }: { params: { slug: string } }) {
  headers()
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const article = await getArticle(params.slug)

  if (!article || !ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="relative mx-auto flex h-full w-full flex-grow flex-col items-center justify-center">
      <EditArticleForm key={article.slug} article={article} />
    </div>
  )
}
