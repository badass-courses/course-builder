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
    <div className="flex flex-col">
      <EditTutorialForm
        moduleSlug={params.module}
        initialTutorialData={course}
      />
      <VideoUploader moduleSlug={params.module} />
    </div>
  )
}
