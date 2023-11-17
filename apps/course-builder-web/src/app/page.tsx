import { Metadata } from "next"
import * as React from "react";
import {Landing} from "@/app/_components/landing";

export const metadata: Metadata = {
  title: "Course Builder",
  description: "Course Builder is a framework for building courses. It's not a course platform. It's not a course marketplace. It's all of the pieces that you need to launch your own course platform and marketplace.",
}

export default async function PlaygroundPage() {
  return  (
    <main>
      <article className="prose mx-auto w-full max-w-2xl px-3 sm:prose-lg">
        <Landing />
      </article>
    </main>
  )
}
