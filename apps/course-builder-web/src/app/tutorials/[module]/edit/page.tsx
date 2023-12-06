import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {notFound, redirect} from 'next/navigation'
import {api} from '@/trpc/server'
import {EditTutorialForm} from '@/app/tutorials/[module]/edit/_form'
import VideoUploader from '@/components/video-uploader'

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

  const course = await api.module.getTutorial.query({slug: params.module})

  if (!course) {
    notFound()
  }

  return (
    <>
      <EditTutorialForm
        moduleSlug={params.module}
        initialTutorialData={course}
      />
      <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
        <div className="md:order-1">
          <VideoUploader moduleSlug={params.module} />
        </div>
      </div>
    </>
  )
}
