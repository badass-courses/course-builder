'use client'

import { useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@coursebuilder/ui/primitives/alert-dialog'
import { buttonVariants } from '@coursebuilder/ui/primitives/button'
import { cn } from '@coursebuilder/ui/utils/cn'

/**
 * Hook that provides a promise-based confirmation dialog
 * @returns Tuple of [ConfirmDialog component, confirm function]
 *
 * @example
 * ```tsx
 * const [ConfirmDialog, confirm] = useConfirm()
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Resource',
 *     description: 'Are you sure you want to delete this resource?',
 *     confirmText: 'Delete',
 *     cancelText: 'Cancel',
 *   })
 *   if (confirmed) {
 *     await deleteResource()
 *   }
 * }
 *
 * return (
 *   <>
 *     <ConfirmDialog />
 *     <button onClick={handleDelete}>Delete</button>
 *   </>
 * )
 * ```
 */
export function useConfirm(): [
	() => JSX.Element,
	(options: ConfirmOptions) => Promise<boolean>,
] {
	const [promise, setPromise] = useState<{
		resolve: (value: boolean) => void
	} | null>(null)
	const [options, setOptions] = useState<ConfirmOptions>({
		title: 'Are you sure?',
		description: 'This action cannot be undone.',
		confirmText: 'Confirm',
		cancelText: 'Cancel',
		variant: 'default',
	})

	const confirm = (opts: ConfirmOptions) => {
		setOptions({ ...options, ...opts })
		return new Promise<boolean>((resolve) => {
			setPromise({ resolve })
		})
	}

	const handleClose = () => {
		setPromise(null)
	}

	const handleConfirm = () => {
		promise?.resolve(true)
		handleClose()
	}

	const handleCancel = () => {
		promise?.resolve(false)
		handleClose()
	}

	const ConfirmDialog = () => (
		<AlertDialog open={promise !== null} onOpenChange={handleClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{options.title}</AlertDialogTitle>
					<AlertDialogDescription>{options.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>
						{options.cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className={
							options.variant === 'destructive'
								? cn(
										buttonVariants({ variant: 'destructive' }),
										'bg-destructive hover:bg-destructive/90 text-white',
									)
								: undefined
						}
					>
						{options.confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)

	return [ConfirmDialog, confirm]
}

interface ConfirmOptions {
	title?: string
	description?: string
	confirmText?: string
	cancelText?: string
	variant?: 'default' | 'destructive'
}
