import {sanityQuery} from '@/server/sanity.server'

export default async function EditTutorialLessonPage({
  params,
}: {
  params: {module: string; lesson: string}
}) {
  const {module, lesson} = params

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

  return (
    <div className="flex flex-col">
      <div>Edit Tutorial Lesson Form</div>
    </div>
  )
}
