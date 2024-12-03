import { use, useState } from 'react'
import { env } from '@/env.mjs'
import { DocumentIcon } from '@heroicons/react/24/solid'
import { useChat } from 'ai/react'
import { cx } from 'class-variance-authority'
import { RefreshCw } from 'lucide-react'

import { VideoResource } from '@coursebuilder/core/schemas'
import { Button, Label, Textarea } from '@coursebuilder/ui'

import { generateSocialSizedSummary } from '../actions'

export interface SocialShareProps {
	post: any // Replace with proper type
	videoResourceLoader: Promise<VideoResource | null>
	onClose?: () => void
}

export function SocialShare({
	post,
	videoResourceLoader,
	onClose,
}: SocialShareProps) {
	const resource = use(videoResourceLoader)

	const transcriptPrompt = resource?.transcript
		? `--- ${post?.fields?.postType} transcript: ${resource?.transcript}`
		: ''
	const { messages, input, handleInputChange, handleSubmit, isLoading } =
		useChat({
			api: `${env.NEXT_PUBLIC_URL}/api/chat`,
			initialMessages: [
				{
					id: '1',
					role: 'system',
					content:
						'You are a social media expert that summarizes lesson transcripts in less than 300 characters.',
				},
				{
					id: '2',
					role: 'assistant',
					content: `Create a concise, engaging summary of this ${post?.fields?.postType}, highlighting the key points in a way that would be suitable for a social media post in less than 300 characters. Please don\'t include hashtags. Include the link at the end of your summary. ${transcriptPrompt}  --- link: https://egghead.io/${post?.fields?.slug} --- ${post?.fields?.postType} body: ${post?.fields?.body}`,
				},
			],
		})
	const [message, setMessage] = useState('')

	const handleGenerateSummary = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log('generate summary')
		handleSubmit(e)
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<h3 className="text-lg font-bold">
				Share your {post?.fields?.postType} to social media
			</h3>
			<div className="flex items-center justify-between">
				<Label htmlFor="message">Message</Label>{' '}
				<span className="text-xs">({message.length}/300)</span>
			</div>
			<div className="flex items-center space-x-2">
				<Textarea
					id="message"
					placeholder="What would you like to say?"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
			</div>
			<form onSubmit={handleGenerateSummary}>
				<Button
					type="submit"
					size="default"
					variant="outline"
					disabled={isLoading}
					aria-label="Generate AI summary"
				>
					<DocumentIcon
						className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
					/>
					Summarize {post?.fields?.postType}
				</Button>
			</form>
			<div className="flex flex-col space-y-2">
				{messages.map((message) => (
					<div
						key={message.id}
						className={cx(`bg-primary text-primary-foreground rounded-lg p-4`, {
							hidden: message.role === 'assistant' || message.role === 'system',
						})}
					>
						{message.content}
					</div>
				))}
			</div>
			<div className="flex justify-end space-x-2">
				{onClose && (
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
				)}
			</div>
		</div>
	)
}
