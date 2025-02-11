'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { useSaleToastNotifier } from '@/hooks/use-sale-toast-notifier'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button, Sheet, SheetContent } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { LogoMark } from '../brand/logo'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useLiveEventToastNotifier } from './use-live-event-toast-notifier'
import { useNavLinks } from './use-nav-links'
import { UserNavigation } from './user'
import { UserMenu } from './user-menu'

const Navigation = () => {
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

	// useLiveEventToastNotifier()
	useSaleToastNotifier()

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery()

	const { data: sessionData, status: sessionStatus } = useSession()

	return (
		<header
			className={cn(
				'bg-background relative z-50 flex h-[var(--nav-height)] w-full items-stretch justify-between border-b px-0 print:hidden',
				{
					'sticky top-0': !params.lesson,
				},
			)}
		>
			<div
				className={cn('flex w-full items-stretch justify-between', {
					// container: !isEditRoute,
				})}
			>
				<div className="flex items-stretch">
					<span
						onContextMenu={(e) => {
							e.preventDefault()
							router.push('/brand')
						}}
					>
						<Link
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="font-heading hover:bg-muted flex h-[var(--nav-height)] w-full items-center justify-center gap-2 px-5 text-lg font-semibold leading-none transition"
						>
							<LogoMark className="w-7" />
							<span className="text-foreground text-xl font-semibold !leading-none">
								<span className="font-mono">AI</span>hero
							</span>
						</Link>
					</span>
					<hr
						aria-hidden="true"
						className="bg-border my-auto flex h-full w-px"
					/>
					{links.length > 0 && (
						<nav
							className={cn('flex items-stretch', {
								'hidden sm:flex': links.length > 3,
							})}
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="flex items-stretch">
								{links.map((link) => {
									return (
										<NavLinkItem
											className="text-base font-medium"
											key={link.href || link.label}
											{...link}
										/>
									)
								})}
							</ul>
						</nav>
					)}
				</div>
				<nav className="flex items-stretch" aria-label={`User navigation`}>
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<ul className="hidden items-stretch sm:flex">
						{sessionStatus === 'authenticated' && (
							<NavLinkItem
								label="Feedback"
								onClick={() => {
									setIsFeedbackDialogOpen(true)
								}}
							/>
						)}
						<UserMenu />
						<ThemeToggle className="hover:bg-muted border-l px-5" />
					</ul>
				</nav>
				<MobileNavigation
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
				/>
			</div>
		</header>
	)
}

export default Navigation
