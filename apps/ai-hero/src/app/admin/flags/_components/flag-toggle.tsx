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
	const [isPending, startTransition] = useTransition()
	const [optimisticValue, setOptimisticValue] = useOptimistic(
		initialValue,
		(_, newValue: boolean) => newValue,
	)

	return (
		<Switch
			disabled={isPending}
			checked={optimisticValue}
			onCheckedChange={(checked) => {
				startTransition(async () => {
					setOptimisticValue(checked)
					await toggleFlag(flagKey, checked)
				})
			}}
		/>
	)
}
