'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import {
	AnimatePresence,
	AnimationControls,
	motion,
	useAnimationControls,
} from 'framer-motion'
import { ChevronDownIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Gravatar from 'react-gravatar'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@coursebuilder/ui'

type NavigationProps = {
	className?: string
	navigationContainerClassName?: string
	size?: 'sm' | 'md' | 'lg'
}

const useAbilities = () => {
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()

	return createAppAbility(abilityRules || [])
}

const Navigation: React.FC<NavigationProps> = ({
	className,
	size = 'md',
	navigationContainerClassName,
}) => {
	const { push } = useRouter()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const [menuOpen, setMenuOpen] = React.useState(false)

	return (
		<>
			<div
				className={cn(
					'z-50 mx-auto flex h-20 w-full max-w-screen-xl flex-col items-center justify-center border-x border-b print:hidden',
					navigationContainerClassName,
				)}
			>
				<motion.nav
					aria-label="top"
					className={cn(
						'relative mx-auto flex w-full items-center justify-between text-sm',
						className,
					)}
				>
					<div className="flex items-center gap-2">
						<Link
							href="/"
							aria-current={isRoot}
							tabIndex={isRoot ? -1 : 0}
							passHref
							className="relative z-10 text-lg font-bold tracking-tight"
							onContextMenu={(event) => {
								event.preventDefault()
								push('/brand')
							}}
						>
							<Logo />
						</Link>
					</div>
					<div className="flex items-center justify-end">
						<User className="hidden md:flex" />
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
								className="absolute left-0 top-0 flex w-full flex-col gap-2 border-b border-gray-100 bg-white px-2 pb-5 pt-16 text-2xl font-medium shadow-2xl shadow-black/20 backdrop-blur-md md:hidden"
							>
								<div className="flex w-full items-center justify-between px-3 pt-5 text-lg">
									<Login />
									<User />
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.nav>
			</div>
		</>
	)
}

export default Navigation

type IconProps = {
	isHovered: boolean
	theme: 'light' | 'dark'
}

const User: React.FC<{ className?: string }> = ({ className }) => {
	const pathname = usePathname()
	const { data: sessionData, status: sessionStatus } = useSession()

	const isLoadingUserInfo = sessionStatus === 'loading'
	const ability = useAbilities()
	const canCreateContent = ability.can('create', 'Content')

	return (
		<>
			{isLoadingUserInfo || !sessionData?.user?.email ? null : (
				<DropdownMenu>
					<DropdownMenuTrigger
						className={cn('mr-3 flex items-center space-x-1', className)}
					>
						<Gravatar
							className="h-7 w-7 rounded-full"
							email={sessionData?.user?.email}
							default="mp"
						/>
						<div className="flex flex-col pl-0.5">
							<span className="inline-flex gap-0.5 text-sm font-bold leading-tight">
								<span className="truncate sm:max-w-[8rem] lg:max-w-[11rem] xl:max-w-none">
									{sessionData?.user?.name?.split(' ')[0]}
								</span>{' '}
								<ChevronDownIcon className="w-2" />
							</span>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>
							{sessionData?.user?.email || 'Account'}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="flex items-center justify-between"
							asChild
						>
							<Link
								href="/profile"
								className={cn({
									underline: pathname.includes('/profile'),
								})}
							>
								Profile
							</Link>
						</DropdownMenuItem>
						{canCreateContent && (
							<>
								{' '}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="flex items-center justify-between"
									asChild
								>
									<Link
										href="/admin"
										className={cn({
											underline: pathname.includes('/admin'),
										})}
									>
										Admin
									</Link>
								</DropdownMenuItem>
							</>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => {
								signOut()
							}}
							className="flex items-center justify-between"
						>
							{' '}
							<span>Log out</span>
							<ArrowRightEndOnRectangleIcon className="h-4 w-4" />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</>
	)
}

const Login: React.FC<{ className?: string }> = ({ className }) => {
	const pathname = usePathname()
	const { data: sessionData, status: sessionStatus } = useSession()
	const isLoadingUserInfo = sessionStatus === 'loading'

	return (
		<>
			{isLoadingUserInfo || sessionData?.user?.email ? null : (
				<Link
					href="/login"
					className={cn(
						'group flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition hover:opacity-100',
						{
							'underline opacity-100': pathname === '/login',
							'opacity-75': pathname !== '/login',
						},
						className,
					)}
				>
					Log in
				</Link>
			)}
		</>
	)
}

export const HamburgerMenuIcon = () => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 15 15"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<path
				d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
	)
}

export const CrossIcon = () => {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 15 15"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			scale="24"
			aria-hidden
		>
			<path
				d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z"
				fill="currentColor"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
		</svg>
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

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
	return (
		<div className="font-heading hover:bg-border/50 flex h-20 w-20 flex-col items-start justify-end border-r pb-3 pl-3 text-xl font-medium leading-none transition">
			<span className="tracking-wide">Pro</span>
			<span className="text-primary">AWS</span>
		</div>
	)
}
