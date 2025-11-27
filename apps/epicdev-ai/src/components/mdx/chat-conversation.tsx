'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'

interface ChatConversationProps {
	children: React.ReactNode
	/** Optional header text displayed above the conversation */
	header?: string
	className?: string
}

/**
 * Container for chat-style conversations in MDX content.
 * Wraps Concern, Response, ChatSetup, and ChatPunchline components.
 *
 * @example
 * ```mdx
 * <ChatConversation header="I can hear your concerns...">
 *   <Concern>Isn't this just the latest hype?</Concern>
 *   <Response>Yes, but it's already gaining widespread adoption.</Response>
 * </ChatConversation>
 * ```
 */
export function ChatConversation({
	children,
	header,
	className,
}: ChatConversationProps) {
	return (
		<section className={cn('not-prose my-8', className)}>
			{header && (
				<p className="text-muted-foreground mb-6 text-sm font-medium uppercase tracking-wider">
					{header}
				</p>
			)}
			<div className="flex flex-col gap-3">{children}</div>
		</section>
	)
}

interface BubbleProps {
	children: React.ReactNode
	/** Custom emoji for the avatar (concerns only) */
	emoji?: string
	className?: string
}

/**
 * A concern/question bubble - displayed on the left with an avatar.
 * Used for user objections, questions, or skeptical thoughts.
 */
export function Concern({ children, emoji = '🤔', className }: BubbleProps) {
	return (
		<div
			className={cn(
				'animate-in fade-in-0 slide-in-from-bottom-2 flex items-end justify-start gap-2',
				className,
			)}
		>
			<div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs">
				{emoji}
			</div>
			<div className="bg-muted text-foreground relative max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[0.95rem] leading-relaxed">
				<div className="bg-muted absolute -left-1.5 bottom-0 h-3 w-3 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
				<span className="italic">{children}</span>
			</div>
		</div>
	)
}

/**
 * A response bubble - displayed on the right.
 * Used for answers, explanations, or authoritative statements.
 */
export function Response({ children, className }: Omit<BubbleProps, 'emoji'>) {
	return (
		<div
			className={cn(
				'animate-in fade-in-0 slide-in-from-bottom-2 flex items-end justify-end gap-2',
				className,
			)}
		>
			<div className="bg-primary text-primary-foreground relative max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[0.95rem] leading-relaxed">
				<div className="bg-primary absolute -right-1.5 bottom-0 h-3 w-3 [clip-path:polygon(0_0,100%_100%,0_100%)]" />
				<span>{children}</span>
			</div>
		</div>
	)
}

interface ChatSetupProps {
	children: React.ReactNode
	className?: string
}

/**
 * Transitional text that appears between message exchanges.
 * Centered, larger text for building up to a key point.
 */
export function ChatSetup({ children, className }: ChatSetupProps) {
	return (
		<p
			className={cn(
				'text-muted-foreground mb-5 mt-10 text-center text-lg font-medium',
				className,
			)}
		>
			{children}
		</p>
	)
}

interface ChatPunchlineProps {
	children: React.ReactNode
	className?: string
}

/**
 * A standalone statement that lands as a conclusion/punchline.
 * Bold, centered text that stands apart from the chat bubbles.
 */
export function ChatPunchline({ children, className }: ChatPunchlineProps) {
	return (
		<p
			className={cn(
				'text-foreground mt-6 text-balance text-center text-xl font-semibold',
				className,
			)}
		>
			{children}
		</p>
	)
}
