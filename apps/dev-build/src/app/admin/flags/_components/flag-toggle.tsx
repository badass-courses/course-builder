'use client'

import { useOptimistic, useTransition } from 'react'

import { Switch } from '@coursebuilder/ui'

import { toggleFlag } from '../actions'

export function FlagToggle({
	flagKey,
	initialValue,
}: {
	flagKey: string
	initialValue: boolean
}) {
	console.log(`[FlagToggle] Initializing ${flagKey} with value:`, initialValue)
	const [isPending, startTransition] = useTransition()
	const [optimisticValue, setOptimisticValue] = useOptimistic(
		initialValue,
		(_, newValue: boolean) => newValue,
	)

	console.log(`[FlagToggle] Current state for ${flagKey}:`, {
		isPending,
		optimisticValue,
	})

	async function handleToggle(newValue: boolean) {
		console.log(`[FlagToggle] Toggling ${flagKey} to:`, newValue)
		try {
			const result = await toggleFlag(flagKey, newValue)
			console.log(`[FlagToggle] Toggle result for ${flagKey}:`, result)
		} catch (error) {
			console.error(`[FlagToggle] Error toggling ${flagKey}:`, error)
			// Reset optimistic value on error
			setOptimisticValue(!newValue)
		}
	}

	return (
		<form
			action={async () => {
				startTransition(async () => {
					const newValue = !optimisticValue
					setOptimisticValue(newValue)
					await handleToggle(newValue)
				})
			}}
		>
			<Switch
				disabled={isPending}
				checked={optimisticValue}
				onCheckedChange={(checked) => {
					startTransition(async () => {
						setOptimisticValue(checked)
						await handleToggle(checked)
					})
				}}
			/>
		</form>
	)
}
