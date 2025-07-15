'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'

import { cn } from '../utils/cn'

const Switch = React.forwardRef<
	React.ElementRef<typeof SwitchPrimitives.Root>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
	<SwitchPrimitives.Root
		className={cn(
			'focus-visible:ring-ring focus-visible:ring-offset-background radix-state-checked:bg-primary radix-state-unchecked:bg-input focus-visible:outline-hidden peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
			className,
		)}
		{...props}
		ref={ref}
	>
		<SwitchPrimitives.Thumb
			className={cn(
				'bg-background radix-state-checked:translate-x-5 radix-state-unchecked:translate-x-0 pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform',
			)}
		/>
	</SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
