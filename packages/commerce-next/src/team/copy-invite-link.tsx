'use client'

import React from 'react'
import { useCopyToClipboard } from 'react-use'

import { Button, Input } from '@coursebuilder/ui'
import { useToast } from '@coursebuilder/ui/primitives/use-toast'

const CopyInviteLink: React.FC<
	React.PropsWithChildren<{
		bulkCouponId: string
		disabled?: boolean
		className?: string
	}>
> = ({ bulkCouponId, disabled = false, className = '' }) => {
	const [_, setCopied] = useCopyToClipboard()
	const inviteLink = `${process.env.NEXT_PUBLIC_URL}?code=${bulkCouponId}`
	const { toast } = useToast()
	return (
		<div data-copy-invite-link="" className={className}>
			<label htmlFor="inviteLink" className="inline-flex pb-1 font-medium">
				Invite link
			</label>
			<div className="flex flex-col gap-2">
				<Input
					readOnly
					disabled={disabled}
					id="inviteLink"
					onClick={(e) => {
						if (disabled) return
						e.currentTarget.select()
					}}
					value={
						disabled ? 'Buy more seats to view your invite link' : inviteLink
					}
					className="text-base"
				/>
				<Button
					variant="secondary"
					type="button"
					onClick={() => {
						setCopied(inviteLink)
						toast({ title: 'Link copied to clipboard' })
					}}
					disabled={disabled}
				>
					Copy Link
				</Button>
			</div>
		</div>
	)
}

export default CopyInviteLink
