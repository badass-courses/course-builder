'use client'

import React from 'react'
import toast from 'react-hot-toast'
import { useCopyToClipboard } from 'react-use'

import { Button, Input } from '@coursebuilder/ui'

const CopyInviteLink: React.FC<
	React.PropsWithChildren<{
		bulkCouponId: string
		disabled?: boolean
		className?: string
	}>
> = ({ bulkCouponId, disabled = false, className = '' }) => {
	const [_, setCopied] = useCopyToClipboard()
	const inviteLink = `${process.env.NEXT_PUBLIC_URL}?code=${bulkCouponId}`

	return (
		<div data-copy-invite-link="" className={className}>
			<label htmlFor="inviteLink">Invite link</label>
			<div>
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
					type="button"
					onClick={() => {
						setCopied(inviteLink)
						toast.success('Copied')
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
