'use client'

import * as React from 'react'
import Link from 'next/link'
import { redirect, usePathname, useRouter } from 'next/navigation'
import { Login } from '@/components/navigation/login'
import {
	ArticlesIcon,
	EventsIcon,
	Logo,
	TipsIcon,
	TutorialsIcon,
	WorkshopsIcon,
} from '@/components/navigation/navigation-icons'
import { User } from '@/components/navigation/user'
import { track } from '@/utils/analytics'
import {
	AnimatePresence,
	motion,
	useAnimationControls,
	type AnimationControls,
} from 'framer-motion'
import { useTheme } from 'next-themes'

import { ThemeToggle } from './theme-toggle'

export const useNavigationLinks = (): {
	label: string | React.JSX.Element
	href: string
	icon: (isHovered: boolean) => React.JSX.Element
}[] => {
	const [hasMounted, setHasMounted] = React.useState(false)
	const { theme } = useTheme()
	React.useEffect(() => {
		setHasMounted(true)
	}, [])

	const getTheme = (theme: string | undefined): 'light' | 'dark' => {
		return theme === 'light' ? 'light' : 'dark'
	}
	return [
		{
			label: (
				<>
					<span className="sm:hidden lg:inline-block">Pro</span> Workshops
				</>
			),
			icon: (isHovered: boolean) => (
				<WorkshopsIcon
					isHovered={isHovered}
					theme={hasMounted ? getTheme(theme) : 'dark'}
				/>
			),
			href: '/workshops',
		},
		{
			label: 'Tips',
			icon: (isHovered: boolean) => (
				<TipsIcon
					isHovered={isHovered}
					theme={hasMounted ? getTheme(theme) : 'dark'}
				/>
			),
			href: '/tips',
		},
		{
			label: (
				<>
					<span className="sm:hidden lg:inline-block">Free</span> Tutorials
				</>
			),
			icon: (isHovered: boolean) => (
				<TutorialsIcon
					isHovered={isHovered}
					theme={hasMounted ? getTheme(theme) : 'dark'}
				/>
			),
			href: '/tutorials',
		},
		{
			label: 'Articles',
			icon: (isHovered: boolean) => (
				<ArticlesIcon
					isHovered={isHovered}
					theme={hasMounted ? getTheme(theme) : 'dark'}
				/>
			),
			href: '/articles',
		},
		{
			label: 'Events',
			icon: (isHovered: boolean) => (
				<EventsIcon
					isHovered={isHovered}
					theme={hasMounted ? getTheme(theme) : 'dark'}
				/>
			),
			href: '/events',
		},
	]
}

export function Links() {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const [menuOpen, setMenuOpen] = React.useState(false)
	const [hoveredNavItemIndex, setHoveredNavItemIndex] = React.useState(-1)

	const navigationLinks = useNavigationLinks()
	return (
		<>
			<div className="flex items-center gap-2">
				<Link
					href="/"
					aria-current={isRoot}
					tabIndex={isRoot ? -1 : 0}
					passHref
					className="relative z-10 text-lg font-bold tracking-tight"
					onContextMenu={(event) => {
						event.preventDefault()
						redirect('/brand')
					}}
				>
					<Logo />
				</Link>
				<div className="hidden items-center justify-start gap-2 font-medium md:flex lg:pl-2">
					{navigationLinks.map(({ label, href, icon }, i) => {
						return (
							<Link
								key={href}
								onMouseOver={() => {
									setHoveredNavItemIndex(i)
								}}
								onMouseLeave={() => {
									setHoveredNavItemIndex(-1)
								}}
								href={href}
								className="group flex items-center gap-1 rounded-md px-1.5 py-1 transition lg:px-2.5"
								passHref
								onClick={() => {
									setHoveredNavItemIndex(i)
									track(`clicked ${label} from navigation`, {
										page: pathname,
									})
								}}
							>
								{icon(
									hoveredNavItemIndex === i ||
										pathname === href ||
										pathname.includes(href),
								)}
								{label}
							</Link>
						)
					})}
				</div>
			</div>
			<div className="flex items-center justify-end">
				<Login className="hidden md:flex" />
				<User className="hidden md:flex" />
				<ThemeToggle className="hidden md:block" />
				<NavToggle isMenuOpened={menuOpen} setMenuOpened={setMenuOpen} />
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
						className="absolute left-0 top-0 flex w-full flex-col gap-2 border-b border-gray-100 bg-white px-2 pb-5 pt-16 text-2xl font-medium shadow-2xl shadow-black/20 backdrop-blur-md md:hidden dark:border-gray-900 dark:bg-black/90 dark:shadow-black/60"
					>
						{navigationLinks.map(({ label, href, icon }) => {
							return (
								<Link
									key={href}
									href={href}
									className="flex items-center gap-4 rounded-md px-3 py-2 transition hover:bg-indigo-300/10 dark:hover:bg-white/5"
									passHref
									onClick={() => setMenuOpen(false)}
								>
									<span className="flex w-5 items-center justify-center">
										{icon(true)}
									</span>
									{label}
								</Link>
							)
						})}
						<div className="flex w-full items-center justify-between px-3 pt-5 text-lg">
							<Login />
							<User />
							<ThemeToggle />
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}

type NavToggleProps = {
	isMenuOpened: boolean
	setMenuOpened: (value: boolean) => void
	menuControls?: AnimationControls
}

const NavToggle: React.FC<NavToggleProps> = ({
	isMenuOpened,
	setMenuOpened,
	menuControls,
}) => {
	const path01Variants = {
		open: { d: 'M3.06061 2.99999L21.0606 21' },
		closed: { d: 'M0 9.5L24 9.5' },
	}
	const path02Variants = {
		open: { d: 'M3.00006 21.0607L21 3.06064' },
		moving: { d: 'M0 14.5L24 14.5' },
		closed: { d: 'M0 14.5L15 14.5' },
	}
	const path01Controls = useAnimationControls()
	const path02Controls = useAnimationControls()

	return (
		<button
			className="absolute z-10 flex h-12 w-12 items-center justify-center p-1 md:hidden"
			onClick={async () => {
				// menuControls.start(isMenuOpened ? 'close' : 'open')
				setMenuOpened(!isMenuOpened)
				if (!isMenuOpened) {
					await path02Controls.start(path02Variants.moving)
					path01Controls.start(path01Variants.open)
					path02Controls.start(path02Variants.open)
				} else {
					path01Controls.start(path01Variants.closed)
					await path02Controls.start(path02Variants.moving)
					path02Controls.start(path02Variants.closed)
				}
			}}
		>
			<svg width="24" height="24" viewBox="0 0 24 24">
				<motion.path
					{...path01Variants.closed}
					animate={path01Controls}
					transition={{ duration: 0.2 }}
					stroke="currentColor"
					strokeWidth={1.5}
				/>
				<motion.path
					{...path02Variants.closed}
					animate={path02Controls}
					transition={{ duration: 0.2 }}
					stroke="currentColor"
					strokeWidth={1.5}
				/>
			</svg>
		</button>
	)
}
