'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import config from '@/config'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

import { useLiveEventToastNotifier } from '../app/use-live-event-toast-notifier'
import { useNavLinks } from '../app/use-nav-links'
import { LogoMark } from '../logo'
import { NavLinkItem } from './nav-link-item'
import { User } from './user'

const Navigation = ({ className }: { className?: string }) => {
	const router = useRouter()
	const links = useNavLinks()
	const pathname = usePathname()
	const params = useParams()
	const isRoot = pathname === '/'
	const isLessonRoute = params.lesson && params.module
	const isEditRoute = pathname.includes('/edit')

	const isFullWidth = Boolean(isEditRoute || isLessonRoute)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	useLiveEventToastNotifier()

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	// const { data: abilityRules, status: abilityStatus } =
	// 	api.ability.getCurrentAbilityRules.useQuery()
	// const ability = createAppAbility(abilityRules)

	return (
		<div
			className={cn('h-(--nav-height) z-40 w-full print:hidden', {
				'fixed top-0 px-1': !isLessonRoute && !isEditRoute,
				className,
			})}
		>
			<header
				className={cn(
					'bg-background relative flex h-full w-full items-stretch justify-between px-0',
					{
						'container rounded border-2 before:absolute before:-bottom-1 before:-z-10 before:h-full before:w-full before:scale-[0.995] before:rounded before:bg-black before:content-[""] sm:rounded sm:rounded-t-none sm:border-t-0':
							!isLessonRoute && !isEditRoute,
						'border-b-2': isEditRoute,
					},
				)}
			>
				<div className="flex items-stretch">
					<span
						className="flex items-stretch"
						onContextMenu={(e) => {
							e.preventDefault()
							router.push('/brand')
						}}
					>
						<Link
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="font-heading bg-primary text-primary-foreground flex h-full w-[76px] items-center justify-center rounded-l-[calc(var(--radius)-3px)] border-r-2 text-lg font-semibold leading-none transition sm:rounded-tl-none"
						>
							{/* <LogoMark className="w-8" /> */}
							<span className="font-rounded text-center text-lg font-semibold uppercase leading-none">
								{config.defaultTitle}
							</span>
						</Link>
					</span>
					{links.length > 0 && (
						<nav
							className="flex items-stretch"
							// TODO: Replace with following once there are more than 3 links
							// className="hidden items-stretch sm:flex"
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="flex items-stretch">
								{links.map((link) => {
									return <NavLinkItem key={link.href || link.label} {...link} />
								})}
							</ul>
						</nav>
					)}
				</div>
				<div className="flex items-stretch">
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<div className="hidden items-stretch sm:flex">
						<User loginClassName="rounded-br-[calc(var(--radius)-3px)]" />
					</div>
				</div>
				<div className="flex items-stretch sm:hidden">
					<MobileNav
						isMobileMenuOpen={isMobileMenuOpen}
						setIsMobileMenuOpen={setIsMobileMenuOpen}
					/>
				</div>
			</header>
		</div>
	)
}

export default Navigation

const MobileNav = ({
	isMobileMenuOpen,
	setIsMobileMenuOpen,
}: {
	isMobileMenuOpen: boolean
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
	const links = useNavLinks()

	return (
		<div className="flex items-stretch">
			<Button
				variant="ghost"
				className="flex h-full items-center justify-center rounded-l-none border-l-2 px-5"
				type="button"
				onClick={() => {
					setIsMobileMenuOpen(!isMobileMenuOpen)
				}}
			>
				{!isMobileMenuOpen ? (
					<Menu className="h-5 w-5" />
				) : (
					<X className="h-5 w-5" />
				)}
			</Button>
			{isMobileMenuOpen && (
				<nav className="bg-background absolute left-0 top-[calc(var(--nav-height)-2px)] z-10 w-full rounded border-2 px-2 py-3">
					{links.length > 0 &&
						links.map((link) => {
							return (
								<NavLinkItem
									className="flex w-full rounded px-2 py-2 text-base"
									key={link.href || link.label}
									{...link}
								/>
							)
						})}
					<User
						loginClassName="px-2 rounded py-2 text-base flex w-full"
						className="flex w-full rounded px-2 py-2 text-base"
					/>
				</nav>
			)}
		</div>
	)
}
