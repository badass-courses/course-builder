'use client'

import * as React from 'react'
import { useWorkshopNavigation } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { useMuxPlayerPrefs } from '@/hooks/use-mux-player-prefs'

import { Label, Switch } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function AutoPlayToggle({ className }: { className?: string }) {
	const workshopNavigation = useWorkshopNavigation()
	const isAutoPlayAvailable = workshopNavigation?.autoPlay === 'available'
	const { getPlayerPrefs, setPlayerPrefs } = useMuxPlayerPrefs()
	const playerPrefs = getPlayerPrefs()
	const bingeMode = playerPrefs.autoplay
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	return mounted && isAutoPlayAvailable ? (
		<div className={cn('flex items-center gap-2', className)}>
			<Label htmlFor="binge-mode-toggle">Autoplay</Label>
			<Switch
				className={cn('', {
					// 'cursor-wait disabled:cursor-wait disabled:opacity-100': isPending,
				})}
				// disabled={isPending}
				aria-label={`Turn Autoplay ${bingeMode ? 'off' : 'on'}`}
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
