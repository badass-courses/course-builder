'use client'

import * as React from 'react'
import { useMuxPlayer } from '@/hooks/use-mux-player'
import { useMuxPlayerPrefs } from '@/hooks/use-mux-player-prefs'

import { Label, Switch } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AutoPlayToggle({ className }: { className?: string }) {
	const { muxPlayerRef } = useMuxPlayer()
	const { getPlayerPrefs, setPlayerPrefs } = useMuxPlayerPrefs()
	const playerPrefs = getPlayerPrefs()
	const autoplay = playerPrefs.autoplay

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Switch
				className={cn('', {
					// 'cursor-wait disabled:cursor-wait disabled:opacity-100': isPending,
				})}
				// disabled={isPending}
				aria-label={`Turn Autoplay ${autoplay ? 'off' : 'on'}`}
				id="autoplay-toggle"
				checked={autoplay}
				defaultChecked={autoplay}
				onCheckedChange={(checked) => {
					if (checked) {
						muxPlayerRef?.current?.play()
					} else {
						muxPlayerRef?.current?.pause()
					}
					setPlayerPrefs({
						autoplay: checked,
					})
				}}
			/>
			<Label htmlFor="autoplay-toggle">Autoplay</Label>
		</div>
	)
}
