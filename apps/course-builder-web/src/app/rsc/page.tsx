'use client'

import * as React from 'react'
import { RefObject, useRef, useState } from 'react'
import { type Metadata } from 'next'
import { Landing } from '@/app/_components/landing'
import { AI } from '@/app/rsc/action'
import { useActions, useUIState } from 'ai/rsc'

import { Button, Textarea } from '@coursebuilder/ui'

// export const metadata: Metadata = {
//   title: 'Course Builder',
//   description:
//     "Course Builder is a framework for building courses. It's not a course platform. It's not a course marketplace. It's all of the pieces that you need to launch your own course platform and marketplace.",
// }

// export default async function PlaygroundPage() {
//   return (
//     <main>
//       <article className="prose sm:prose-lg dark:prose-invert mx-auto w-full max-w-2xl px-5 py-8 sm:py-16">
//         <Landing />
//       </article>
//     </main>
//   )
// }

export function useEnterSubmit(): {
  formRef: RefObject<HTMLFormElement>
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
} {
  const formRef = useRef<HTMLFormElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      formRef.current?.requestSubmit()
      event.preventDefault()
    }
  }

  return { formRef, onKeyDown: handleKeyDown }
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [inputValue, setInputValue] = useState('')

  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  return (
    <main>
      <div className="pb-[200px] pt-4 md:pt-10">
        {messages.length ? (
          <>
            {messages.map((message) => (
              <div key={message.id}>{message.display}</div>
            ))}
          </>
        ) : (
          <div />
        )}
      </div>
      <article className="prose sm:prose-lg dark:prose-invert mx-auto w-full max-w-2xl px-5 py-8 sm:py-16">
        <form
          ref={formRef}
          onSubmit={async (e: any) => {
            e.preventDefault()

            // Blur focus on mobile
            if (window.innerWidth < 600) {
              e.target['message']?.blur()
            }

            const value = inputValue.trim()
            setInputValue('')
            if (!value) return

            // Add user message UI
            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: Date.now(),
                display: <div>{value}</div>,
              },
            ])

            try {
              // Submit and get response message
              const responseMessage = await submitUserMessage(value)
              setMessages((currentMessages) => [...currentMessages, responseMessage])
            } catch (error) {
              // You may want to show a toast or trigger an error state.
              console.error(error)
            }
          }}
        >
          <div className="bg-background relative flex max-h-60 w-full grow flex-col overflow-hidden px-8 sm:rounded-md sm:border sm:px-12">
            <Button
              variant="outline"
              size="icon"
              className="bg-background absolute left-0 top-4 h-8 w-8 rounded-full p-0 sm:left-4"
              onClick={(e) => {
                e.preventDefault()
                window.location.reload()
              }}
            >
              <span>New Chat</span>
            </Button>
            <Textarea
              ref={inputRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              placeholder="Send a message."
              className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              name="message"
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="absolute right-0 top-4 sm:right-4">
              <Button type="submit" size="icon" disabled={inputValue === ''}>
                {'->'}
                <span>Send message</span>
              </Button>
            </div>
          </div>
        </form>
      </article>
    </main>
  )
}
