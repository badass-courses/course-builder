'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus2, Loader2 } from 'lucide-react'

import { ContentResource } from '@coursebuilder/core/schemas'
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@coursebuilder/ui'

import { CreateWorkshop } from './create-workshop'

/**
 * Props for the CreateWorkshopModal component.
 * Provides configuration for dialog behavior and workshop creation handling.
 */
export interface CreateWorkshopModalProps {
	/**
	 * Callback fired when the dialog's open state changes
	 */
	onOpenChange?: (isOpen: boolean) => void
	/**
	 * Override default navigation behavior after resource creation
	 */
	onResourceCreated?: (resource: ContentResource) => Promise<void>
	/**
	 * Whether to show the default trigger button
	 * @default true
	 */
	showTrigger?: boolean
	/**
	 * Control the dialog's open state
	 * @default false
	 */
	open?: boolean
	/**
	 * Custom title for the dialog header
	 * @default 'New Workshop'
	 */
	title?: string
	/**
	 * Custom label for the trigger button text
	 * @default "New Workshop"
	 */
	triggerLabel?: string
	/**
	 * Whether to show the contributor selectable option
	 * @default false
	 */
	contributorSelectable?: boolean
}

/**
 * Modal dialog for creating new workshop resources.
 *
 * @example
 * ```tsx
 * <CreateWorkshopModal
 *   onResourceCreated={async (resource) => {
 *     // Custom handling after creation
 *   }}
 * />
 * ```
 */
export function CreateWorkshopModal({
	contributorSelectable = false,
	onOpenChange,
	onResourceCreated,
	showTrigger = true,
	open,
	title = 'New Workshop',
	triggerLabel = 'New Workshop',
}: CreateWorkshopModalProps) {
	const [isOpen, setIsOpen] = React.useState(open)
	const [isProcessing, setIsProcessing] = React.useState(false)

	React.useEffect(() => {
		setIsOpen(open)
	}, [open])

	const handleResourceCreated = async (resource: ContentResource) => {
		setIsProcessing(true)
		if (onResourceCreated) {
			await onResourceCreated(resource)
		}
		// Reset processing state and allow modal to be closed
		setIsProcessing(false)
		// Auto-close the dialog after successful creation when no custom
		// onResourceCreated handler is provided
		if (!onResourceCreated) {
			setIsOpen(false)
		}
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (isProcessing) return // prevent closing while processing
				if (onOpenChange) {
					onOpenChange(open)
				}
				setIsOpen(open)
			}}
		>
			{showTrigger && (
				<DialogTrigger asChild>
					<Button
						variant="default"
						type="button"
						className="gap-1"
						onClick={() => setIsOpen(true)}
					>
						<FilePlus2 className="h-4 w-4" /> {triggerLabel}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent>
				{title && (
					<DialogHeader className="">
						<DialogTitle className="font-heading mb-3 flex items-center gap-2 text-2xl font-semibold">
							{isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
							{isProcessing ? 'Creating...' : title}
						</DialogTitle>
					</DialogHeader>
				)}
				<CreateWorkshop
					contributorSelectable={contributorSelectable}
					onResourceCreated={handleResourceCreated}
				/>
			</DialogContent>
		</Dialog>
	)
}
