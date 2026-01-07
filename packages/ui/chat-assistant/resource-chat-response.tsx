import * as React from 'react'
import { useRef } from 'react'
import { User } from '@auth/core/types'
import { AnimatePresence, motion } from 'framer-motion'
import { CopyIcon, LoaderIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { useSocket } from '../hooks/use-socket'
import { Button } from '../primitives/button'
import { Gravatar } from '../primitives/react-gravatar'
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
	const {
		messages,
		setMessages,
		isWaitingForResponse,
		setIsWaitingForResponse,
	} = useChatAssistant()
	const div = useRef<any>(null)

	useSocket({
		host: hostUrl,
		room: requestId,
		onMessage: (messageEvent) => {
			try {
				const messageData = JSON.parse(messageEvent.data)

				if (messageData.userId) {
					// It's a user message, add it directly.
					const alreadyAdded = messages.find(
						(msg) => !msg.requestId && msg.body === messageData.body,
					)
					if (!alreadyAdded) {
						setMessages((prev) => [
							...prev,
							{
								body: messageData.body,
								userId: messageData.userId,
								requestId: messageData.requestId,
							},
						])
					}
				} else {
					setIsWaitingForResponse(false)
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
		<ScrollArea ref={div} className="h-full w-full scroll-smooth text-sm">
			{messages.length === 0 && user ? (
				<div className="prose prose-sm dark:prose-invert p-5">
					{user.name
						? `Hi ${user.name?.split(' ')[0]}, I’m your assistant and I’m here to help you get things done faster.`
						: 'Hi, I’m your assistant and I’m here to help you get things done faster.'}
				</div>
			) : null}
			{messages.map((message, index) => (
				<div key={index} className="border-b p-5 last-of-type:border-b-0">
					<MessageHeader userData={message.userId ? user : null} />
					<ReactMarkdown
						className="prose prose-sm dark:prose-invert"
						components={{
							pre: ({ children }) => <PreWithCopy children={children} />,
						}}
					>
						{message.body}
					</ReactMarkdown>
				</div>
			))}
			{isWaitingForResponse && (
				<div className="prose prose-sm dark:prose-invert p-5">
					<LoaderIcon className="inline-block h-4 w-4 animate-spin opacity-75" />
				</div>
			)}
		</ScrollArea>
	)
}

function MessageHeader({ userData }: { userData?: User | null }) {
	return (
		<div className="pb-1">
			{userData ? (
				<div className="flex items-center gap-1">
					{userData?.email && (
						<Gravatar
							className="h-5 w-5 rounded-full"
							email={userData.email}
							default="mp"
						/>
					)}
					<strong>{userData?.name?.split(' ')[0] || 'User'}</strong>
				</div>
			) : (
				<strong>Assistant</strong>
			)}
		</div>
	)
}

const PreWithCopy = ({ children }: { children: React.ReactNode }) => {
	const [copied, setCopied] = React.useState(false)

	const handleCopy = () => {
		const codeElement = document.querySelector('code')
		if (codeElement) {
			navigator.clipboard
				.writeText(codeElement.textContent || '')
				.then(() => {
					setCopied(true)
				})
				.catch((err) => {
					console.error('Failed to copy text: ', err)
				})
		}
	}
	React.useEffect(() => {
		if (copied) {
			const timer = setTimeout(() => setCopied(false), 2000)
			return () => clearTimeout(timer)
		}
	}, [copied])

	return (
		<div className="not-prose relative -mx-5">
			<pre className="bg-secondary/50 text-foreground overflow-x-auto rounded-none p-5 text-xs">
				{children}
			</pre>
			<div className="absolute right-2 top-2 flex items-center space-x-1">
				<AnimatePresence>
					{copied && (
						<motion.span
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 10 }}
							transition={{ duration: 0.2 }}
							className="text-xs leading-none opacity-75"
						>
							Copied!
						</motion.span>
					)}
				</AnimatePresence>
				<Button
					variant="secondary"
					type="button"
					size="icon"
					onClick={handleCopy}
					className="flex h-4 w-4 items-center space-x-1"
				>
					<CopyIcon className="h-3 w-3" />
				</Button>
			</div>
		</div>
	)
}

const ChatContext = React.createContext<{
	messages: Message[]
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>
	isWaitingForResponse: boolean
	setIsWaitingForResponse: React.Dispatch<React.SetStateAction<boolean>>
}>({
	messages: [],
	setMessages: () => {},
	isWaitingForResponse: false,
	setIsWaitingForResponse: () => {},
})
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
	const [messages, setMessages] = React.useState<Message[]>([])
	const [isWaitingForResponse, setIsWaitingForResponse] = React.useState(false)
	return (
		<ChatContext.Provider
			value={{
				messages,
				setMessages,
				isWaitingForResponse,
				setIsWaitingForResponse,
			}}
		>
			{children}
		</ChatContext.Provider>
	)
}
export const useChatAssistant = () => React.useContext(ChatContext)
