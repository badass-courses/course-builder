'use client'

import * as React from 'react'
import { useMuxPlayerPrefs } from '@/hooks/use-mux-player-prefs'

import { Label, Switch } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function BingeModeToggle() {
	const { getPlayerPrefs, setPlayerPrefs } = useMuxPlayerPrefs()
	const playerPrefs = getPlayerPrefs()
	const bingeMode = playerPrefs.autoplay
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	return mounted ? (
		<div className="flex items-center gap-2">
			<Label htmlFor="binge-mode-toggle" className="font-light">
				Binge Mode
			</Label>
			<Switch
				className={cn('', {
					// 'cursor-wait disabled:cursor-wait disabled:opacity-100': isPending,
				})}
				// disabled={isPending}
				aria-label={`Turn binge mode ${bingeMode ? 'off' : 'on'}`}
				id="binge-mode-toggle"
				checked={bingeMode}
				defaultChecked={bingeMode}
				onCheckedChange={(checked) => {
					setPlayerPrefs({
						autoplay: checked,
					})
				}}
			/>
		</div>
	) : null
}
