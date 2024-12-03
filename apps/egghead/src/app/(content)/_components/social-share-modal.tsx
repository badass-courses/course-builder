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
import { SocialShare } from './social-share'

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
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Share Your Lesson</DialogTitle>
					<DialogDescription>
						Promote your newly uploaded lesson on social media platforms.
					</DialogDescription>
				</DialogHeader>
				<SocialShare post={post} onClose={onClose} />
			</DialogContent>
		</Dialog>
	)
}
