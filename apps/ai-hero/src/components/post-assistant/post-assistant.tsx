'use client'

import Link from 'next/link'
import Spinner from '@/components/spinner'
import { cn } from '@/utils/cn'
import { useChat } from '@ai-sdk/react'

import { Button, Textarea } from '@coursebuilder/ui'

export function PostAssistant() {
	const { messages, input, handleInputChange, handleSubmit, isLoading } =
		useChat({
			api: '/api/post-assistant',
		})

	return (
		<div className="flex w-full flex-col space-y-4">
			<div className="flex flex-col space-y-4">
				{messages.map((m) => (
					<div
						key={m.id}
						className={cn('flex w-full', {
							'justify-end': m.role !== 'assistant',
						})}
					>
						{/* Regular message content */}
						{m.content && (
							<p
								className={cn(
									'bg-muted inline-flex flex-col justify-end gap-2 rounded-lg p-4',
									{
										'bg-muted items-end pr-6 [&_p]:max-w-[80%]':
											m.role !== 'assistant',
									},
								)}
							>
								{m.content}
							</p>
						)}

						{/* Tool calls from parts */}
						{m.parts?.map((part, i) => {
							if (part.type === 'tool-invocation') {
								if (part.toolInvocation.toolName === 'createPosts') {
									// @ts-ignore-next-line
									const results = part?.toolInvocation?.result
									if (!Array.isArray(results)) {
										return (
											<div
												key="loading results"
												className={`text-muted-foreground flex items-center gap-2 text-sm`}
											>
												<Spinner className="mx-1 w-4" /> Working...
											</div>
										)
									}

									return (
										<div key={i} className="flex flex-col gap-1">
											{results.map((result, j) => (
												<p key={j + 'result'} className="">
													{result.success ? 'Created' : 'Failed to create'} post{' '}
													{result.success ? (
														<Link
															href={`/${result.postSlug}`}
															className="text-primary hover:underline"
															target="_blank"
														>
															"{result.title}"
														</Link>
													) : (
														`"${result.title}"`
													)}
												</p>
											))}
										</div>
									)
								} else if (
									['createPost', 'updatePost'].includes(
										part.toolInvocation.toolName,
									)
								) {
									// @ts-ignore-next-line
									const result = part?.toolInvocation?.result
									if (!result) {
										return (
											<div
												key="loading result"
												className={`text-muted-foreground flex items-center gap-2 text-sm`}
											>
												<Spinner className="mx-1 w-4" /> Working...
											</div>
										)
									}

									const action =
										part.toolInvocation.toolName === 'createPost'
											? 'Created'
											: 'Updated'
									return (
										<p key={i} className="">
											{action} post{' '}
											<Link
												href={`/${result.postSlug}`}
												className="text-primary hover:underline"
												target="_blank"
											>
												"{result.title}"
											</Link>
										</p>
									)
								}
							}
							return null
						})}
					</div>
				))}
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col space-y-2">
				<Textarea
					value={input}
					onChange={handleInputChange}
					placeholder="e.g. create post 'My new post'"
					disabled={isLoading}
				/>
				<Button type="submit" variant="secondary" disabled={isLoading}>
					{isLoading ? 'Thinking...' : 'Send'}
				</Button>
			</form>
		</div>
	)
}
