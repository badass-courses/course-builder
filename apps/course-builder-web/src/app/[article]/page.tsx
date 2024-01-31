import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAbility } from '@/lib/ability'
import { getArticle } from '@/lib/articles'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForTitle } from '@/utils/get-og-image-for-title'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'

type Props = {
  params: { article: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const article = await getArticle(params.article)

  if (!article) {
    return parent as Metadata
  }

  const previousImages = (await parent).openGraph?.images || []

  const ogImage = getOGImageUrlForTitle(article.title)

  return {
    title: article.title,
    openGraph: {
      images: [ogImage, ...previousImages],
    },
  }
}

async function ArticleActionBar({ slug }: { slug: string }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const article = await getArticle(slug)

  return (
    <>
      {article && ability.can('update', 'Content') ? (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1">
          <div />
          <Button asChild className="h-7">
            <Link href={`/articles/${article.slug || article._id}/edit`}>Edit</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
      )}
    </>
  )
}

async function Article({ slug }: { slug: string }) {
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="mt-4 pb-32">
      <ReactMarkdown className="prose dark:prose-invert">{article.body}</ReactMarkdown>
      <ReactMarkdown>{article.description}</ReactMarkdown>
    </div>
  )
}

async function ArticleTitle({ slug }: { slug: string }) {
  const article = await getArticle(slug)

  return <h1 className="text-3xl font-bold">{article?.title}</h1>
}

export default async function ArticlePage({ params }: { params: { article: string } }) {
  return (
    <div>
      <Suspense fallback={<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />}>
        <ArticleActionBar slug={params.article} />
      </Suspense>
      <article className="flex flex-col p-5 sm:p-10">
        <ArticleTitle slug={params.article} />
        <Article slug={params.article} />
      </article>
    </div>
  )
}
