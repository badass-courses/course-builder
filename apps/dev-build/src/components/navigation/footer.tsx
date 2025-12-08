'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { env } from '@/env.mjs'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Logo } from '../brand/logo'
import TickerScroll from '../ticker-scroll'

/**
 * Footer component with navigation, newsletter subscription, and theme toggle
 */
export default function Footer() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const { resolvedTheme: theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	if (isEditRoute) {
		return null
	}

	return (
		<footer className="flex w-full flex-col items-center justify-center border-t">
			<div className="w-full border-b">
				<div className="px-0! container border-x">
					<TickerScroll className="h-8 w-full" reverse />
				</div>
			</div>
			<div className="container flex w-full flex-col gap-12 border-x px-0 pt-10 sm:pt-24">
				{/* Top section */}
				<div className="flex w-full flex-col items-start justify-between gap-8 px-5 sm:px-10 lg:flex-row lg:items-center">
					<div className="flex w-full flex-col items-center gap-8 md:items-start lg:flex-row lg:items-center lg:gap-12">
						<Link href="/" tabIndex={isRoot ? -1 : 0}>
							<Logo />
						</Link>
						{/* Navigation */}
						<nav className="text-muted-foreground flex flex-col items-center gap-8 text-base md:flex-row">
							<Link href="/" className="hover:text-foreground transition">
								Home
							</Link>
							{/* <Link
								href="/browse?type=cohort"
								className="hover:text-foreground transition"
							>
								Cohorts
							</Link> */}
							<Link
								href="/contact"
								className="hover:text-foreground transition"
							>
								Contact
							</Link>
							<Link
								href={`mailto:${env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
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
					{
						status === 'pending' ? (
							<div className="w-full" />
						) : subscriber ? (
							<Link
								className="hover:text-foreground text-muted-foreground shrink-0 transition"
								href="/login"
							>
								Log in
							</Link>
						) : null
						// <SubscribeToConvertkitForm
						// 	emailPlaceholder="Your email"
						// 	className="flex w-full flex-row items-start gap-3 text-left sm:max-w-[350px] sm:flex-col lg:flex-row lg:items-end [&_[data-sr-fieldset]]:first-of-type:hidden [&_button]:px-4 [&_input]:h-10 [&_input]:flex-1 [&_label]:sr-only"
						// />
					}
				</div>

				{/* Separator */}
				<div className="border-border h-px w-full border-t" />

				{/* Bottom section */}
				<div className="flex flex-col items-center justify-between gap-4 px-5 pb-10 sm:px-10 lg:flex-row lg:items-center">
					{/* Copyright */}
					<p className="text-muted-foreground text-sm">
						{new Date().getFullYear()} © dev.build
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
									mounted && theme === 'dark'
										? 'translate-x-6'
										: 'translate-x-0',
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
