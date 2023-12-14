import * as React from 'react'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {notFound, redirect} from 'next/navigation'
import {api} from '@/trpc/server'
import {EditTutorialForm} from '@/app/tutorials/[module]/edit/_form'
import VideoUploader from '@/components/video-uploader'
import Tree from '@/components/lesson-list/tree'
import ModuleEdit from '@/components/module-edit'

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

  const tutorial = await api.module.getTutorial.query({slug: params.module})

  if (!tutorial) {
    notFound()
  }

  return (
    <>
      <ModuleEdit tutorial={tutorial} />

      <div className="flex flex-col">
        <VideoUploader moduleSlug={params.module} />
        <Tree
          initialData={[
            ...tutorial.sections.map((section) => {
              return {
                id: section._id,
                label: section.title,
                type: section.moduleType,
                itemData: section,
                children:
                  section.lessons?.map((lesson) => {
                    return {
                      id: lesson._id,
                      label: lesson.title,
                      type: lesson.moduleType,
                      children: [],
                      itemData: lesson,
                    }
                  }) ?? [],
              }
            }),
            ...tutorial.lessons.map((lesson) => {
              return {
                id: lesson._id,
                label: lesson.title,
                type: lesson.moduleType,
                children: [],
                itemData: lesson,
              }
            }),
          ]}
        />
      </div>
    </>
  )
}
