'use client'

import * as React from 'react'
import { useMuxPlayer } from '@/hooks/use-mux-player'

import { Label, Switch } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AutoPlayToggle({ className }: { className?: string }) {
	const { muxPlayerRef, playerPrefs, setPlayerPrefs } = useMuxPlayer()

	const handleAutoplayChange = React.useCallback(
		(checked: boolean) => {
			if (checked) {
				muxPlayerRef?.current?.play()
			} else {
				muxPlayerRef?.current?.pause()
			}
			setPlayerPrefs({
				autoplay: checked,
			})
		},
		[muxPlayerRef, setPlayerPrefs],
	)

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Switch
				className={cn('')}
				aria-label={`Turn Autoplay ${playerPrefs.autoplay ? 'off' : 'on'}`}
				id="autoplay-toggle"
				checked={playerPrefs.autoplay}
				onCheckedChange={handleAutoplayChange}
			/>
			<Label htmlFor="autoplay-toggle">Autoplay</Label>
		</div>
	)
}
