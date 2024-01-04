import {sanityQuery} from '@/server/sanity.server'
import {getServerAuthSession} from '@/server/auth'
import {getAbility} from '@/lib/ability'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditTutorialLessonPage({
  params,
}: {
  params: {module: string; lesson: string}
}) {
  const {module, lesson} = params

  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  const lessonData = await sanityQuery<{
    _id: string
    title: string
    description: string
    slug: string
  }>(`*[slug.current == "${lesson}"][0]{
    _id,
    _type, 
    title, 
    description, 
    "slug": slug.current,
    "lessons": lessons[]->{
      _id, 
      title, 
      description, 
      "slug": slug.current,
    }
  }`)

  if (!lessonData || !ability.can('update', 'Content')) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <div>Edit Tutorial Lesson Form</div>
    </div>
  )
}
