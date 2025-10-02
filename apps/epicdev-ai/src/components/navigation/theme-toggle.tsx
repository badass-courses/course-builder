'use client'

import * as React from 'react'
import { Check, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function ThemeToggle({ className }: { className?: string }) {
	const { setTheme, theme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	// if (!mounted) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="link"
					className={cn(
						'text-foreground flex h-full items-center gap-2 py-3',
						className,
					)}
				>
					<div className="text-muted-foreground flex h-full w-full items-center justify-center">
						<Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					</div>
					<span className="capitalize">{mounted && theme} Theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Theme</DropdownMenuLabel>
				<DropdownMenuItem
					onClick={() => setTheme('light')}
					className="flex items-center justify-between gap-2"
				>
					Light {theme === 'light' && <Check className="h-4 w-4" />}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme('dark')}
					className="flex items-center justify-between gap-2"
				>
					Dark {theme === 'dark' && <Check className="h-4 w-4" />}
				</DropdownMenuItem>
				{/* <DropdownMenuItem
					onClick={() => setTheme('system')}
					className="flex items-center justify-between gap-2"
				>
					System {theme === 'system' && <Check className="h-4 w-4" />}
				</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
