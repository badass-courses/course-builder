'use client'

import * as React from 'react'
import Link from 'next/link'
import { redirect, usePathname } from 'next/navigation'
import { Login } from '@/components/navigation/login'
import { User } from '@/components/navigation/user'
import config from '@/config'
import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'
import { cx } from 'class-variance-authority'
import {
	AnimatePresence,
	motion,
	useAnimationControls,
	type AnimationControls,
} from 'framer-motion'

import { HamburgerMenuIcon } from '../navigation'
import { ThemeToggle } from './theme-toggle'

export const getNavigationLinks = (): {
	label: string | React.JSX.Element
	href: string
	icon: () => string
}[] => {
	return [
		// {
		// 	label: 'Tutorials',
		// 	href: '/tutorials',
		// 	icon: () => '📚',
		// },
		// {
		// 	label: 'Courses',
		// 	href: '/courses',
		// 	icon: () => '🎓',
		// },
		// {
		// 	label: 'Brands',
		// 	href: '/brands',
		// 	icon: () => '🏷️',
		// },
		// {
		// 	label: 'About',
		// 	href: '/about',
		// 	icon: () => '📝',
		// },
	]
}

export function Links({ className }: { className?: string }) {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const [menuOpen, setMenuOpen] = React.useState(false)

	const navigationLinks = getNavigationLinks()
	return (
		<motion.nav
			aria-label="top"
			className={cn(
				'relative mx-auto flex w-full items-center justify-between px-2.5 text-sm',

				className,
			)}
		>
			<div className={cn('flex w-full items-center justify-between gap-8')}>
				<Link
					href="/"
					aria-current={isRoot}
					tabIndex={isRoot ? -1 : 0}
					passHref
					className={cn(
						'z-10 inline-flex items-baseline justify-center gap-1 bg-black px-2.5 py-1.5 font-sans text-sm font-bold text-white',
						{
							'absolute left-2': navigationLinks.length > 0,
						},
					)}
					onContextMenu={(event) => {
						event.preventDefault()
						redirect('/brand')
					}}
				>
					{/* <span className="text-lg leading-none">⬖</span> */}
					{config.defaultTitle}
				</Link>
				<nav className="absolute hidden md:flex">
					<ul className="flex items-center gap-5 text-lg font-semibold">
						{navigationLinks.map(({ label, href, icon }) => {
							return (
								<li key={href}>
									<Link href={href} className={cx('')} passHref>
										{icon()} {label}
									</Link>
								</li>
							)
						})}
					</ul>
				</nav>
			</div>
			<div className="absolute right-2 flex items-center justify-end gap-2">
				<Login className="hidden md:flex" />
				<User className="hidden md:flex" />
				{/* <ThemeToggle /> */}
				{navigationLinks.length > 0 && (
					<NavToggle isMenuOpened={menuOpen} setMenuOpened={setMenuOpen} />
				)}
			</div>
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						initial={{ y: -30, opacity: 0, scale: 0.9 }}
						animate={{ y: 0, opacity: 1, scale: 1 }}
						exit={{ y: -30, opacity: 0, scale: 0.9 }}
						transition={{
							type: 'spring',
							duration: 0.5,
						}}
						className="bg-card absolute left-0 top-0 flex w-full flex-col gap-2 border-b px-2 pb-5 pt-16 text-2xl font-medium shadow-2xl shadow-black/20 backdrop-blur-md md:hidden"
					>
						{navigationLinks.map(({ label, href, icon }) => {
							return (
								<Link
									key={href}
									href={href}
									className="flex items-center gap-4 rounded-md px-3 py-2 transition hover:bg-indigo-300/10"
									passHref
									onClick={() => setMenuOpen(false)}
								>
									{label}
								</Link>
							)
						})}

						<div className="flex w-full items-center justify-between px-3 pt-5 text-lg">
							<Login />
							<User />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.nav>
	)
}

type NavToggleProps = {
	isMenuOpened: boolean
	setMenuOpened: (value: boolean) => void
}

const NavToggle: React.FC<NavToggleProps> = ({
	isMenuOpened,
	setMenuOpened,
}) => {
	return (
		<button
			className="z-10 flex h-12 w-12 items-center justify-center p-1 md:hidden"
			onClick={async () => {
				setMenuOpened(!isMenuOpened)
			}}
		>
			<HamburgerMenuIcon />
		</button>
	)
}
