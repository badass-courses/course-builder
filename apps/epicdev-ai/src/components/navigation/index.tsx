'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, Newspaper, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { Logo } from '../brand/logo'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

const Navigation = ({ withContainer }: { withContainer?: boolean }) => {
	const links = useNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()
	const { setIsFeedbackDialogOpen } = useFeedback()

	const isLessonRoute = params.lesson && params.module
	const isFullWidth = Boolean(isEditRoute || isLessonRoute)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	// const { data: abilityRules, status: abilityStatus } =
	// 	api.ability.getCurrentAbilityRules.useQuery()

	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	return (
		<header
			className={cn(
				'relative z-50 flex h-[var(--nav-height)] w-full items-center justify-between print:hidden',
				{
					'px-5': !withContainer,
				},
			)}
		>
			<div
				className={cn('relative flex w-full items-center justify-center', {
					// container: !isEditRoute,
				})}
			>
				<span
					className="flex items-center justify-center"
					onContextMenu={(e) => {
						e.preventDefault()
						router.push('/brand')
					}}
				>
					<Link
						prefetch
						tabIndex={isRoot ? -1 : 0}
						href="/"
						className="font-heading absolute left-0 flex items-center justify-center gap-2 pr-5 text-lg font-semibold leading-none transition"
					>
						<Logo />
					</Link>
				</span>
				{links.length > 0 && (
					<nav
						className={cn('flex items-center', {
							'hidden md:flex': true, // links.length > 3,
						})}
						aria-label={`Navigation header with ${links.length} links`}
					>
						<ul className="flex items-center">
							{links.map((link) => {
								return (
									<NavLinkItem
										className="text-base font-medium [&_span]:flex [&_span]:items-center"
										key={link.href || link.label}
										{...link}
									/>
								)
							})}
						</ul>
					</nav>
				)}

				<nav
					className="absolute right-0 flex items-center"
					aria-label={`User navigation`}
				>
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<ul className="hidden items-center md:flex">
						{sessionStatus === 'authenticated' && (
							<NavLinkItem
								label="Feedback"
								onClick={() => {
									setIsFeedbackDialogOpen(true)
								}}
							/>
						)}
						{/* {sessionStatus === 'unauthenticated' && !subscriber && (
							<NavLinkItem
								href="/newsletter"
								className="[&_span]:flex [&_span]:items-center"
								label={
									<>
										<Newspaper className="text-muted-foreground mr-2 w-3" />
										Newsletter
									</>
								}
							/>
						)} */}
						<UserMenu />
						<ThemeToggle className="" />
					</ul>
				</nav>
				<MobileNavigation
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
					subscriber={subscriber}
				/>
			</div>
		</header>
	)
}

export default Navigation
