'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { useConvertkitForm } from '@/hooks/use-convertkit-form'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Moon, Sun } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'

import { Button, Input } from '@coursebuilder/ui'

import { LogoVideo } from './logo-video'

/**
 * Footer component with navigation, newsletter subscription, and theme toggle
 */
export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	if (isEditRoute) {
		return null
	}

	return (
		<footer className="flex w-full flex-col items-center justify-center px-5 py-24">
			<div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12">
				{/* Top section */}
				<div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
					{/* Left: Logo + Nav */}
					<div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
						{/* Logo */}
						<Link
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="flex items-center gap-2"
						>
							<LogoVideo />
							<div className="flex flex-col">
								<span className="text-muted-foreground text-[9.3px] font-medium leading-tight">
									Code with
								</span>
								<span className="text-foreground text-[19.7px] font-bold leading-tight">
									Antonio
								</span>
							</div>
						</Link>

						{/* Navigation */}
						<nav className="text-muted-foreground flex items-center gap-8 text-base">
							<Link href="/" className="hover:text-foreground transition">
								Home
							</Link>
							<Link
								href="/cohorts"
								className="hover:text-foreground transition"
							>
								Cohorts
							</Link>
							<Link
								href="/contact"
								className="hover:text-foreground transition"
							>
								Contact
							</Link>
							<Link
								href="/support"
								className="hover:text-foreground transition"
							>
								Support
							</Link>
							<Link href="/faq" className="hover:text-foreground transition">
								FAQ
							</Link>
						</nav>
					</div>

					{/* Right: Newsletter subscription */}
					{status === 'pending' ? null : subscriber ? (
						<div>
							<Link href="/login">Log in</Link>
						</div>
					) : (
						<SubscribeToConvertkitForm
							emailPlaceholder="Your email"
							className="flex w-full max-w-[350px] flex-col items-start gap-3 text-left lg:flex-row lg:items-end [&_[data-sr-fieldset]]:first-of-type:hidden [&_button]:px-4 [&_input]:h-10 [&_input]:flex-1 [&_label]:sr-only"
						/>
					)}
					{/* <form onSubmit={handleSubmit} className="gap-2">
						<Input
							{...register('email')}
							type="email"
							placeholder="Your email"
							className="h-10 flex-1 rounded-md border"
							disabled={isSubmitting}
						/>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="h-10 rounded-md bg-[#2b47ff] px-4 text-sm font-medium text-white hover:bg-[#2438d4]"
						>
							Subscribe
						</Button>
					</form> */}
				</div>

				{/* Separator */}
				<div className="border-border h-px w-full border-t" />

				{/* Bottom section */}
				<div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
					{/* Copyright */}
					<p className="text-muted-foreground text-sm">
						{new Date().getFullYear()} © codewithantonio.com
					</p>

					{/* Right: Terms + Theme Toggle */}
					<div className="flex items-center gap-8">
						<Link
							href="/privacy"
							className="text-muted-foreground hover:text-foreground text-sm transition"
						>
							Terms of Service
						</Link>

						{/* Theme Toggle */}
						<button
							onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
							className="border-border bg-background relative flex h-6 w-12 items-center rounded-full border transition-colors"
							aria-label="Toggle theme"
						>
							<div
								className={cn(
									'border-border bg-background absolute h-6 w-6 rounded-full border transition-transform duration-200',
									theme === 'dark' ? 'translate-x-6' : 'translate-x-0',
								)}
							>
								<div className="flex h-full w-full items-center justify-center">
									<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
									<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		</footer>
	)
}
