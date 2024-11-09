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

export function ThemeToggle() {
	const { setTheme, theme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="flex h-full items-stretch rounded-none"
				>
					<div className="text-muted-foreground flex h-full w-full items-center justify-center">
						<Sun className="h-3 w-3 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Moon className="absolute h-3 w-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					</div>
					<span className="sr-only">Toggle theme</span>
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
				{/* <DropdownMenuItem onClick={() => setTheme('system')}>
					System
				</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
