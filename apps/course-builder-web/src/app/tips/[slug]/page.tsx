import * as React from 'react'
import { Suspense, use } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TipPlayer } from '@/app/tips/_components/tip-player'
import { getAbility } from '@/lib/ability'
import { getTip, Tip } from '@/lib/tips'
import { VideoResource } from '@/lib/video-resource'
import { getServerAuthSession } from '@/server/auth'
import { sanityQuery } from '@/server/sanity.server'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

type Props = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const tip = await getTip(params.slug)

  if (!tip) {
    return parent as Metadata
  }

  const previousImages = (await parent).openGraph?.images || []

  const ogImage = getOGImageUrlForResource(tip, 'tips')

  return {
    title: tip.title,
    openGraph: {
      images: [ogImage, ...previousImages],
    },
  }
}

export default async function TipPage({ params }: { params: { slug: string } }) {
  const tipLoader = getTip(params.slug)
  return (
    <div>
      <main className="mx-auto w-full" id="tip">
        <Suspense fallback={<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />}>
          <TipActionBar slug={params.slug} tipLoader={tipLoader} />
        </Suspense>

        <PlayerContainer slug={params.slug} tipLoader={tipLoader} />
        <article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
          <div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
            <div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
              <div className="flex flex-col lg:col-span-8">
                <TipBody slug={params.slug} tipLoader={tipLoader} />
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

async function TipActionBar({ slug, tipLoader }: { slug: string; tipLoader: Promise<Tip | null> }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await tipLoader

  return (
    <>
      {tip && ability.can('update', 'Content') ? (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1">
          <div />
          <Button asChild className="h-7">
            <Link href={`/tips/${tip.slug || tip._id}/edit`}>Edit</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
      )}
    </>
  )
}

function PlayerContainerSkeleton() {
  return (
    <div className="relative z-10 flex items-center justify-center">
      <div className="flex w-full max-w-screen-lg flex-col">
        <div className="relative aspect-[16/9]">
          <div className="flex items-center justify-center  overflow-hidden">
            <div className="h-full w-full bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

async function PlayerContainer({ slug, tipLoader }: { slug: string; tipLoader: Promise<Tip | null> }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await tipLoader
  const displayOverlay = false

  if (!tip) {
    notFound()
  }

  const videoResourceLoader = sanityQuery<VideoResource>(
    `*[_type == "videoResource" && _id == "${tip.videoResourceId}"][0]`,
    { tags: ['tips', tip._id] },
  )

  return (
    <Suspense fallback={<PlayerContainerSkeleton />}>
      <div className="relative z-10 flex items-center justify-center">
        <div className="flex w-full max-w-screen-lg flex-col">
          <div className="relative aspect-[16/9]">
            <div
              className={cn('flex items-center justify-center  overflow-hidden', {
                hidden: displayOverlay,
              })}
            >
              <TipPlayer videoResourceLoader={videoResourceLoader} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

async function TipBody({ slug, tipLoader }: { slug: string; tipLoader: Promise<Tip | null> }) {
  const tip = await tipLoader

  if (!tip) {
    notFound()
  }

  return (
    <>
      <h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
        {tip.title}
      </h1>

      {tip.body && (
        <>
          <ReactMarkdown className="prose dark:prose-invert">{tip.body}</ReactMarkdown>
        </>
      )}
      {tip.transcript && (
        <div className="w-full max-w-2xl pt-5">
          <h3 className="font-bold">Transcript</h3>
          <ReactMarkdown className="prose dark:prose-invert">{tip.transcript}</ReactMarkdown>
        </div>
      )}
    </>
  )
}
