import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TipPlayer } from '@/app/tips/_components/tip-player'
import { getAbility } from '@/lib/ability'
import { getTip } from '@/lib/tips'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForTitle } from '@/utils/get-og-image-for-title'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'

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

  const ogImage = getOGImageUrlForTitle(tip.title)

  return {
    title: tip.title,
    openGraph: {
      images: [ogImage, ...previousImages],
    },
  }
}

export default async function TipPage({ params }: { params: { slug: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  const tip = await getTip(params.slug)

  if (!tip) {
    notFound()
  }

  return (
    <div>
      {ability.can('update', 'Content') ? (
        <div className="bg-muted flex h-9 w-full items-center justify-between px-1">
          <div />
          <Button asChild className="h-7">
            <Link href={`/tips/${tip.slug || tip._id}/edit`}>Edit</Link>
          </Button>
        </div>
      ) : null}
      <main className="mx-auto w-full" id="tip">
        <div className="relative z-10 flex items-center justify-center">
          <div className="flex w-full max-w-screen-lg flex-col">
            <TipPlayer videoResourceId={tip.videoResourceId} muxPlaybackId={tip.muxPlaybackId} />
          </div>
        </div>
        <article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
          <div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
            <div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
              <div className="flex flex-col lg:col-span-8">
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
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
