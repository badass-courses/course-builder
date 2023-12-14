/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Hw1J8tftoVR
 */

import {Button, Input, Label, Textarea} from '@coursebuilder/ui'
import {EditTutorialForm} from '@/app/tutorials/[module]/edit/_form'
import * as React from 'react'

export default function Component({tutorial}: {tutorial: any}) {
  return (
    <div key="1" className="grid grid-cols-8 gap-4 p-4">
      <div className="col-span-2">
        <h1 className="text-2xl font-bold">This is my Product</h1>
        <p className="my-2 text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
        <EditTutorialForm
          moduleSlug={tutorial.slug}
          initialTutorialData={tutorial}
        />
        <div className="space-y-2">
          <div>
            <h2 className="font-bold">Section 1</h2>
            <ul className="list-disc pl-4">
              <li>Lesson 1</li>
              <li>Lesson 2</li>
              <li>Generate Titles</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold">Section 2</h2>
            <ul className="list-disc pl-4">
              <li>Lesson 3</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold">External Resource</h2>
            <ul className="list-disc pl-4">
              <li>Generate Embeddings</li>
            </ul>
          </div>
          <Button className="mt-2" variant="outline">
            + add lessons
          </Button>
          <Button className="mt-2" variant="outline">
            + add section
          </Button>
          <Button className="mt-2" variant="outline">
            + add resource
          </Button>
        </div>
      </div>
      <div className="col-span-4">
        <h2 className="text-xl font-bold">Lesson 2</h2>
        <div className="mt-2 aspect-video bg-gray-200" />
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Lesson 2 - Problem</h2>
          <div className="flex space-x-2">
            <Button variant="ghost">body</Button>
            <Button variant="ghost">transcript</Button>
            <Button variant="ghost">
              <ExpandIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="markdown-editor">Markdown Editor</Label>
          <Textarea
            id="markdown-editor"
            placeholder="Type your markdown here."
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This editor supports markdown syntax.
          </p>
        </div>
        <form className="mt-4 space-y-4">
          <section className="mt-4 space-y-4">
            <h2 className="text-xl font-bold">Exercise</h2>
            <textarea
              className="mt-2 h-[100px] w-full border border-gray-300 p-2"
              placeholder="Exercise Body Text"
            />
          </section>
          <h2 className="text-xl font-bold">Solution Video URL</h2>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="solutionVideo">Upload Solution Video</Label>
            <Input id="solutionVideo" type="file" />
          </div>
          <textarea
            className="mt-2 h-[100px] w-full border border-gray-300 p-2"
            placeholder="Solution Body Text"
          />
          <section className="mt-4 space-y-4">
            <h2 className="text-xl font-bold">Resources</h2>
            <ul className="list-disc pl-4">
              <li>Resource 1</li>
              <li>Resource 2</li>
              <li>Resource 3</li>
            </ul>
            <Button variant="outline">+ add resource</Button>
          </section>
        </form>
      </div>
      <div className="col-span-2 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-4 text-xl font-bold">Chat Assistant</h2>
        <div className="mb-4 h-[300px] overflow-auto rounded-md border border-gray-200">
          <div className="p-4 text-gray-500">
            Start a conversation with the assistant...
          </div>
        </div>
        <div>
          <Label htmlFor="chat-input">New Message</Label>
          <Textarea
            className="mb-2"
            id="chat-input"
            placeholder="Type your message here."
          />
          <Button>Send</Button>
        </div>
      </div>
    </div>
  )
}

function ExpandIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
    </svg>
  )
}
