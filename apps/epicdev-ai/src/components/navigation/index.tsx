'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { ActiveEventButton } from '@/app/(content)/events/_components/active-event'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, Newspaper, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { Logo } from '../brand/logo'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

const Navigation = ({
	withContainer,
	highlightedResource,
}: {
	withContainer?: boolean
	highlightedResource?: { path: string; title: string }
}) => {
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
				'h-(--nav-height) relative z-50 flex w-full items-center justify-between print:hidden',
				{
					'px-5': !withContainer,
				},
			)}
		>
			<div className="bg-linear-to-r absolute inset-x-0 -top-6 h-12 -rotate-3 from-violet-300 via-pink-300 to-sky-300 opacity-50 blur-3xl dark:opacity-40" />
			<div
				className={cn('relative flex w-full items-center justify-center', {
					// container: !isEditRoute,
				})}
			>
				<span
					className="flex items-center justify-center"
					// onContextMenu={(e) => {
					// 	e.preventDefault()
					// 	router.push('/brand')
					// }}
				>
					<Button
						asChild
						variant="ghost"
						className="h-10 p-0 text-lg hover:bg-transparent"
					>
						<Link
							prefetch
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="font-heading absolute left-0 flex items-center justify-center gap-2 pr-5 text-lg font-semibold leading-none transition"
						>
							<Logo className="origin-left scale-[1.15]" />
						</Link>
					</Button>
				</span>
				{links.length > 0 && (
					<nav
						className={cn(
							'ring-gray-800/7.5 absolute items-center rounded-full border border-white/50 bg-white/50 px-1 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 backdrop-blur-xl dark:border-white/5 dark:bg-white/5',
							{
								'hidden lg:flex': true, // links.length > 3,
							},
						)}
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
					<ul className="hidden items-center lg:flex">
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
						<ActiveEventButton className="" />
						{/* <ThemeToggle className="" /> */}
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
