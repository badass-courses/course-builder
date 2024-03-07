import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAbility } from '@/lib/ability'
import { type Article } from '@/lib/articles'
import { getArticle } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
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

  return {
    title: article.title,
    openGraph: { images: [getOGImageUrlForResource(article)] },
  }
}

async function ArticleActionBar({ articleLoader }: { articleLoader: Promise<Article | null> }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const article = await articleLoader

  return (
    <>
      {article && ability.can('update', 'Content') ? (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1">
          <div />
          <Button asChild size="sm">
            <Link href={`/articles/${article.slug || article._id}/edit`}>Edit</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
      )}
    </>
  )
}

async function Article({ articleLoader }: { articleLoader: Promise<Article | null> }) {
  const article = await articleLoader

  if (!article) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-10 pt-10 md:flex-row md:gap-16 md:pt-16">
      <ReactMarkdown className="prose dark:prose-invert sm:prose-lg max-w-none">{article.body}</ReactMarkdown>
      {article.description && (
        <aside className="prose dark:prose-invert prose-sm mt-3 flex w-full flex-shrink-0 flex-col gap-3 md:max-w-[280px]">
          <div className="border-t pt-5">
            <strong>Description</strong>
            <ReactMarkdown>{article.description}</ReactMarkdown>
          </div>
        </aside>
      )}
    </div>
  )
}

async function ArticleTitle({ articleLoader }: { articleLoader: Promise<Article | null> }) {
  const article = await articleLoader

  return <h1 className="text-3xl font-bold sm:text-4xl">{article?.title}</h1>
}

export default async function ArticlePage({ params }: { params: { article: string } }) {
  const articleLoader = getArticle(params.article)
  return (
    <div>
      <Suspense fallback={<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />}>
        <ArticleActionBar articleLoader={articleLoader} />
      </Suspense>
      <article className="mx-auto flex w-full max-w-screen-lg flex-col px-5 py-10 md:py-16">
        <ArticleTitle articleLoader={articleLoader} />
        <Article articleLoader={articleLoader} />
      </article>
    </div>
  )
}
