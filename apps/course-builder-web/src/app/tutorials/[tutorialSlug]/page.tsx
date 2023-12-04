import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {redirect} from 'next/navigation'
import {Separator} from '@coursebuilder/ui'
import VideoUploader from '@/components/video-uploader'
import * as React from 'react'
import {sanityQuery} from '@/server/sanity.server'

export default async function ModulePage({
  params,
}: {
  params: {moduleSlug: string}
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (!ability.can('view', 'Anything')) {
    redirect('/login')
  }

  const course = await sanityQuery(
    `*[_type == "module" && slug.current == "${params.moduleSlug}"][0]`,
  )

  console.log('course', course)

  return (
    <div className="hidden h-full flex-col md:flex">
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold">{course.title}</h2>
      </div>
      <Separator />
      <div className="container h-full py-6">
        <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
          <div className="md:order-1">
            <VideoUploader moduleSlug={params.moduleSlug} />
          </div>
        </div>
      </div>
    </div>
  )
}
