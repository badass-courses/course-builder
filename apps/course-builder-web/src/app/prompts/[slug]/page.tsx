import * as React from 'react'
import { Suspense } from 'react'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAbility } from '@/ability'
import { type Prompt } from '@/lib/prompts'
import { getPrompt } from '@/lib/prompts-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'

type Props = {
  params: { prompt: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const prompt = await getPrompt(params.prompt)

  if (!prompt) {
    return parent as Metadata
  }

  return {
    title: prompt.title,
    openGraph: { images: [getOGImageUrlForResource(prompt)] },
  }
}

async function PromptActionBar({
  promptLoader,
}: {
  promptLoader: Promise<Prompt | null>
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  const prompt = await promptLoader

  if (!user || !ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <>
      {prompt && ability.can('update', 'Content') ? (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1">
          <div />
          <Button asChild size="sm">
            <Link href={`/prompts/${prompt.slug || prompt._id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
      )}
    </>
  )
}

async function Prompt({
  promptLoader,
}: {
  promptLoader: Promise<Prompt | null>
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  const prompt = await promptLoader

  if (!prompt || !user || !ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-10 pt-10 md:flex-row md:gap-16 md:pt-16">
      <ReactMarkdown className="prose dark:prose-invert sm:prose-lg max-w-none">
        {prompt.body}
      </ReactMarkdown>
      {prompt.description && (
        <aside className="prose dark:prose-invert prose-sm mt-3 flex w-full flex-shrink-0 flex-col gap-3 md:max-w-[280px]">
          <div className="border-t pt-5">
            <strong>Description</strong>
            <ReactMarkdown>{prompt.description}</ReactMarkdown>
          </div>
        </aside>
      )}
    </div>
  )
}

async function PromptTitle({
  promptLoader,
}: {
  promptLoader: Promise<Prompt | null>
}) {
  const prompt = await promptLoader

  return <h1 className="text-3xl font-bold sm:text-4xl">{prompt?.title}</h1>
}

export default async function PromptPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const user = session?.user

  if (!user || !ability.can('create', 'Content')) {
    notFound()
  }

  const promptLoader = getPrompt(params.slug)

  return (
    <div>
      <Suspense
        fallback={
          <div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
        }
      >
        <PromptActionBar promptLoader={promptLoader} />
      </Suspense>
      <article className="mx-auto flex w-full max-w-screen-lg flex-col px-5 py-10 md:py-16">
        <PromptTitle promptLoader={promptLoader} />
        <Prompt promptLoader={promptLoader} />
      </article>
    </div>
  )
}
