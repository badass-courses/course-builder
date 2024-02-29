import * as React from 'react'
import { type Metadata } from 'next'
import { Landing } from '@/app/_components/landing'

export const metadata: Metadata = {
  title: 'Course Builder',
  description:
    "Course Builder is a framework for building courses. It's not a course platform. It's not a course marketplace. It's all of the pieces that you need to launch your own course platform and marketplace.",
}

export default async function PlaygroundPage() {
  return (
    <main>
      <article className="prose sm:prose-lg dark:prose-invert mx-auto w-full max-w-2xl px-5 py-8 sm:py-16">
        <Landing />
      </article>
    </main>
  )
}
