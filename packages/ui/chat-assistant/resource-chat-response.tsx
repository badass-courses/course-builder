import * as React from 'react'
import { useRef } from 'react'
import { User } from '@auth/core/types'
import ReactMarkdown from 'react-markdown'

import { useSocket } from '../hooks/use-socket'
import { ScrollArea } from '../primitives/scroll-area'

const STREAM_COMPLETE = `\\ok`

type Message = {
	body: string
	requestId?: string
	userId?: string
}

export function ResourceChatResponse({
	requestId,
	hostUrl,
	user,
}: {
	requestId: string
	hostUrl: string
	user?: User | null
}) {
	const [messages, setMessages] = React.useState<Message[]>([])
	const div = useRef<any>(null)

	useSocket({
		host: hostUrl,
		room: requestId,
		onMessage: (messageEvent) => {
			try {
				const messageData = JSON.parse(messageEvent.data)

				if (messageData.userId) {
					// It's a user message, add it directly.
					setMessages((prev) => [
						...prev,
						{
							body: messageData.body,
							userId: messageData.userId,
							requestId: messageData.requestId,
						},
					])
				} else {
					// It's an assistant message part, check for STREAM_COMPLETE
					if (messageData.body === STREAM_COMPLETE) {
						// When stream is complete, do not append anything.
						// If you need to handle the end of a stream (e.g., to clean up or mark as complete), do it here.
					} else if (messageData.name === 'code.extraction.completed') {
						setMessages((prevMessages) => {
							return [
								...prevMessages,
								{
									body: messageData.body.content,
									requestId: messageData.requestId,
								},
							]
						})
					} else {
						// It's a part of an assistant's message (streaming), append to the last assistant message.
						setMessages((prev) => {
							let lastMessage = prev[prev.length - 1]
							if (
								lastMessage &&
								!lastMessage.userId &&
								lastMessage.requestId === messageData.requestId
							) {
								if (typeof messageData.body !== 'object') {
									// Continuation of the last assistant message: append the body part.
									return [
										...prev.slice(0, -1),
										{
											...lastMessage,
											body: lastMessage.body + messageData.body,
										},
									]
								} else {
									// If the message is an object, it's the last part of the message.
									return [
										...prev.slice(0, -1),
										{ ...lastMessage, body: lastMessage.body },
									]
								}
							} else {
								// New assistant message: add as a new message.
								return [
									...prev,
									{ body: messageData.body, requestId: messageData.requestId },
								]
							}
						})
					}
				}

				if (div.current) {
					div.current.scrollTop = div.current.scrollHeight
				}
			} catch (error) {
				// noting to do
			}
		},
	})

	return (
		<ScrollArea
			viewportRef={div}
			className="h-full w-full scroll-smooth text-sm"
		>
			{messages.length === 0 && user ? (
				<div className="prose prose-sm dark:prose-invert p-5">
					{`Hi ${user.name?.split(' ')[0]}, I’m your assistant and I’m here to help you get things done
          faster.`}
				</div>
			) : null}
			{messages.map((message, index) => (
				<div key={index} className="border-b p-5 last-of-type:border-b-0">
					<MessageHeader userData={message.userId ? user : null} />
					<ReactMarkdown className="prose prose-sm dark:prose-invert">
						{message.body}
					</ReactMarkdown>
				</div>
			))}
		</ScrollArea>
	)
}

function MessageHeader({ userData }: { userData?: User | null }) {
	return (
		<div className="pb-1">
			{userData ? (
				<div className="flex items-center gap-1">
					<strong>{userData?.name?.split(' ')[0] || 'User'}</strong>
				</div>
			) : (
				<strong>Assistant</strong>
			)}
		</div>
	)
}
