import VideoUploader from '@/components/video-uploader'
import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {notFound, redirect} from 'next/navigation'
import {sanityQuery} from '@/server/sanity.server'

export default async function EditTutorialPage({
  params,
}: {
  params: {module: string}
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (!ability.can('edit', 'Module')) {
    redirect('/login')
  }

  const course = await sanityQuery<{title: string; description: string}>(
    `*[_type == "module" && moduleType == 'tutorial' && (_id == "${params.module}" || slug.current == "${params.module}")][0]`,
  )

  if (!course) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <div>Edit Tutorial Form</div>
      <div className="container h-full py-6">
        <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
          <div className="md:order-1">
            <VideoUploader moduleSlug={params.module} />
          </div>
        </div>
      </div>
    </div>
  )
}
