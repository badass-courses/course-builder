'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { env } from '@/env.mjs'
import { Post } from '@/lib/posts'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Textarea,
} from '@coursebuilder/ui'

import { Share } from './share'

export default function SharePostModal({ post }: { post: Post }) {
	const [open, setOpen] = useState(false)
	const [message, setMessage] = useState('')
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()
	const url = env.NEXT_PUBLIC_URL + pathname

	useEffect(() => {
		const published = searchParams.get('published')
		if (published === 'true') {
			setOpen(true)
		}
	}, [searchParams])

	const handleClose = () => {
		setOpen(false)
		router.push(window.location.pathname)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Share</DialogTitle>
					<DialogDescription className="pb-4">
						If you don't share it, no one will know about it!
					</DialogDescription>
					<Share post={post} message={message} />
					<DialogDescription className="flex items-center justify-between pt-4 text-sm">
						<span>Add a message to your post</span>{' '}
						<span>({message.length}/300)</span>
					</DialogDescription>
					<Textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Learn how to..."
					/>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						<a href={url} target="_blank" rel="noopener noreferrer">
							View {post?.fields?.postType}
						</a>
					</Button>
					<Button variant="secondary" onClick={handleClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
