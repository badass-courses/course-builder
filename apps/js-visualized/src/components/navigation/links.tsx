'use client'

import * as React from 'react'
import Link from 'next/link'
import { redirect, usePathname } from 'next/navigation'
import { Login } from '@/components/navigation/login'
import { User } from '@/components/navigation/user'
import { cn } from '@/utils/cn'
import { cx } from 'class-variance-authority'
import {
	AnimatePresence,
	motion,
	useAnimationControls,
	type AnimationControls,
} from 'framer-motion'

import { ThemeToggle } from './theme-toggle'

const Logo = () => {
	return (
		<>
			<span className="text-body-text">JavaScript</span>{' '}
			<span className="bg-gradient-green-to-blue bg-clip-text font-black text-transparent">
				Visualized
			</span>
		</>
	)
}

export const getNavigationLinks = (): {
	label: string | React.JSX.Element
	href: string
	icon: () => string
}[] => {
	return [
		// {
		// 	label: 'Posts',
		// 	icon: () => '',
		// 	href: '/posts',
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
			className={cn('relative w-full text-sm', className)}
		>
			<div className="container flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Link
						href="/"
						aria-current={isRoot}
						tabIndex={isRoot ? -1 : 0}
						passHref
						className="relative z-10 text-sm"
						onContextMenu={(event) => {
							event.preventDefault()
							redirect('/brand')
						}}
					>
						<Logo />
					</Link>
					<div className="hidden items-center justify-start gap-2 font-medium md:flex lg:pl-2">
						{navigationLinks.map(({ label, href, icon }) => {
							return (
								<Link
									key={href}
									href={href}
									className={cx(
										'group flex items-center gap-1 rounded-md px-1.5 py-1 transition lg:px-2.5',
									)}
									passHref
								>
									{icon()} {label}
								</Link>
							)
						})}
					</div>
				</div>
				<div className="flex items-center justify-end gap-2">
					{/* <Login className="hidden md:flex" />
				<User className="hidden md:flex" />
				<ThemeToggle />
				<NavToggle isMenuOpened={menuOpen} setMenuOpened={setMenuOpen} /> */}
					<a
						href="#waitlist"
						className="hover:border-jsv-green group flex h-10 items-center items-center overflow-hidden rounded-full border border-transparent bg-[linear-gradient(90deg,var(--jsv-hazy-charcoal)_0%,var(--jsv-green)_50%,var(--jsv-hazy-charcoal)_100%)] text-sm font-medium duration-500 sm:h-12"
					>
						<span className="flex grow items-center self-stretch rounded-full bg-[#151617] bg-[linear-gradient(to_right,#292B2C,#000,#292B2C,#292B2C,#000,#292B2C)] bg-[length:300%_100%] px-6 text-white/75 duration-300 group-hover:bg-[position:100%_0] group-hover:text-white sm:px-10">
							join the waitlist
						</span>
					</a>
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
			</div>
		</motion.nav>
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

	const [shouldAnimate, setShouldAnimate] = React.useState(false)
	React.useEffect(() => {
		if (!shouldAnimate) {
			return
		}

		async function animateMenu() {
			if (!isMenuOpened) {
				await path02Controls.start(path02Variants.moving)
				path01Controls.start(path01Variants.open)
				path02Controls.start(path02Variants.open)
			} else {
				path01Controls.start(path01Variants.closed)
				await path02Controls.start(path02Variants.moving)
				path02Controls.start(path02Variants.closed)
			}

			setShouldAnimate(false)
		}

		animateMenu()
	}, [shouldAnimate, isMenuOpened])

	return (
		<button
			className="z-10 flex h-12 w-12 items-center justify-center p-1 md:hidden"
			onClick={async () => {
				// menuControls.start(isMenuOpened ? 'close' : 'open')
				setMenuOpened(!isMenuOpened)
				setShouldAnimate(true)
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
