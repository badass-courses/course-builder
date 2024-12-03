'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Facebook, Linkedin, RefreshCw, Twitter } from 'lucide-react'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from '@coursebuilder/ui'

import { generateSocialSizedSummary } from '../actions'

interface SocialShareModalProps {
	isOpen: boolean
	onClose: () => void
	post: ContentResource
}

export function SocialShareModal({
	isOpen,
	onClose,
	post,
}: SocialShareModalProps) {
	const [message, setMessage] = useState('')
	const [selectedPlatforms, setSelectedPlatforms] = useState({
		facebook: false,
		twitter: false,
		linkedin: false,
	})
	const [isSharing, setIsSharing] = useState(false)
	const [shareSuccess, setShareSuccess] = useState(false)
	const [isSummarizing, setIsSummarizing] = useState(false)
	const [summary, setSummary] = useState('')

	const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
		setSelectedPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }))
	}

	const handleShare = async () => {
		setIsSharing(true)
		try {
			// Here you would implement the actual sharing logic
			console.log(
				'Sharing to:',
				Object.entries(selectedPlatforms)
					.filter(([_, v]) => v)
					.map(([k]) => k),
			)
			console.log('Message:', message)

			// Simulate API call for sharing
			await new Promise((resolve) => setTimeout(resolve, 2000))

			setShareSuccess(true)
			setTimeout(() => {
				onClose()
				setShareSuccess(false)
			}, 2000)
		} catch (error) {
			console.error('Error sharing:', error)
		} finally {
			setIsSharing(false)
		}
	}

	const handleGenerateSummary = async () => {
		setIsSummarizing(true)
		try {
			const generatedSummary = await generateSocialSizedSummary({
				transcript: post?.fields?.transcript,
				link: `${post?.fields?.transcript}`,
			})
			const summaryText = await generatedSummary.text()
			setSummary(summaryText)
			setMessage(summaryText)
		} catch (error) {
			console.error('Error generating summary:', error)
		} finally {
			setIsSummarizing(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Share Your Lesson</DialogTitle>
					<DialogDescription>
						Promote your newly uploaded lesson on social media platforms.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<p className="col-span-3 font-semibold">{post?.fields?.title}</p>
					</div>
					<div className="flex space-x-4">
						<Checkbox
							id="facebook"
							checked={selectedPlatforms.facebook}
							onCheckedChange={() => handlePlatformToggle('facebook')}
						/>
						<Label
							htmlFor="facebook"
							className="flex cursor-pointer items-center space-x-2"
						>
							<Facebook className="h-5 w-5 text-blue-600" />
							<span>Facebook</span>
						</Label>
					</div>
					<div className="flex space-x-4">
						<Checkbox
							id="twitter"
							checked={selectedPlatforms.twitter}
							onCheckedChange={() => handlePlatformToggle('twitter')}
						/>
						<Label
							htmlFor="twitter"
							className="flex cursor-pointer items-center space-x-2"
						>
							<Twitter className="h-5 w-5 text-sky-500" />
							<span>Twitter</span>
						</Label>
					</div>
					<div className="flex space-x-4">
						<Checkbox
							id="linkedin"
							checked={selectedPlatforms.linkedin}
							onCheckedChange={() => handlePlatformToggle('linkedin')}
						/>
						<Label
							htmlFor="linkedin"
							className="flex cursor-pointer items-center space-x-2"
						>
							<Linkedin className="h-5 w-5 text-blue-700" />
							<span>LinkedIn</span>
						</Label>
					</div>
					<div className="grid w-full gap-1.5">
						<Label htmlFor="message">Message</Label>
						<div className="flex items-center space-x-2">
							<Textarea
								id="message"
								placeholder="Add a custom message to your post..."
								value={message}
								onChange={(e) => setMessage(e.target.value)}
							/>
							<Button
								size="icon"
								variant="outline"
								onClick={handleGenerateSummary}
								disabled={isSummarizing}
								aria-label="Generate AI summary"
							>
								<RefreshCw
									className={`h-4 w-4 ${isSummarizing ? 'animate-spin' : ''}`}
								/>
							</Button>
						</div>
					</div>
					{summary && (
						<div className="text-muted-foreground text-sm">
							<p>AI-generated summary:</p>
							<p>{summary}</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleShare} disabled={isSharing}>
						{isSharing ? 'Sharing...' : shareSuccess ? 'Shared!' : 'Share'}
						{shareSuccess && <Check className="ml-2 h-4 w-4" />}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
