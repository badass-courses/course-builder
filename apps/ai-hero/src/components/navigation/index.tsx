'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { useSaleToastNotifier } from '@/hooks/use-sale-toast-notifier'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ChevronRight, Menu, Newspaper, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { LogoMark } from '../brand/logo'
import { CldImage } from '../cld-image'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useLiveEventToastNotifier } from './use-live-event-toast-notifier'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

/**
 * Session-dependent nav items that use mounted state to prevent hydration mismatch.
 * By deferring render until after hydration, we ensure consistent tree structure.
 */
const SessionDependentNavItems = ({
	sessionStatus,
	subscriber,
	setIsFeedbackDialogOpen,
}: {
	sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
	subscriber: unknown
	setIsFeedbackDialogOpen: (open: boolean) => void
}) => {
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	// Return nothing during SSR and initial hydration to keep tree consistent
	if (!mounted) {
		return null
	}

	return (
		<>
			{sessionStatus === 'authenticated' && (
				<NavLinkItem
					className="hidden font-normal lg:flex"
					label="Feedback"
					onClick={() => {
						setIsFeedbackDialogOpen(true)
					}}
				/>
			)}
			{sessionStatus === 'unauthenticated' && !subscriber && (
				<NavLinkItem
					href="/newsletter"
					className="rounded-none border-l [&_span]:flex [&_span]:items-center"
					label={
						<>
							<Newspaper className="mr-2 w-3 text-indigo-600 dark:text-orange-300" />
							Newsletter
						</>
					}
				/>
			)}
		</>
	)
}

const Navigation = () => {
	const navData = useNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()
	const { setIsFeedbackDialogOpen } = useFeedback()

	const isLessonRoute = params.lesson && params.module

	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	// useLiveEventToastNotifier()
	// useSaleToastNotifier()

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	return (
		<header
			className={cn(
				'dark:bg-background h-(--nav-height) relative z-50 flex w-full items-stretch justify-between border-b bg-white px-0 print:hidden',
				{
					'sticky top-0': !params.lesson,
				},
			)}
		>
			<div className={cn('flex w-full items-stretch justify-between', {})}>
				<div className="flex items-stretch">
					<span
						onContextMenu={(e) => {
							e.preventDefault()
							router.push('/brand')
						}}
					>
						<Link
							prefetch
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="font-heading hover:bg-muted h-(--nav-height) flex w-full items-center justify-center gap-2 px-5 text-lg font-semibold leading-none transition"
						>
							<LogoMark className="w-7" />
							<span className="text-foreground leading-none! text-xl font-semibold">
								<span className="font-mono">AI</span>hero
							</span>
						</Link>
					</span>
					<hr
						aria-hidden="true"
						className="bg-border my-auto flex h-full w-px"
					/>
					<NavigationMenu
						delayDuration={0}
						skipDelayDuration={0}
						viewport={true}
						className="hidden items-stretch lg:flex"
					>
						<NavigationMenuList className="divide-border flex h-full items-stretch gap-0 divide-x">
							{navData.events.length > 0 && (
								<NavigationMenuItem className="items-stretch">
									<NavigationMenuTrigger className="dark:bg-background relative flex h-full items-center bg-white font-normal">
										Events
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="w-[300px] md:w-[550px] lg:w-[550px]">
											{navData.events.map((event) => (
												<NavigationMenuLink key={event.href} asChild>
													<Link
														href={event.href}
														className="relative flex flex-row items-center gap-5 pr-8"
														onClick={() => {
															track('navigation_menu_item_click', {
																resource: event.title,
																type: 'event',
																category: 'navigation',
															})
														}}
													>
														<CldImage
															src={event.image.src}
															alt={event.image.alt}
															width={event.image.width}
															height={event.image.height}
															className="rounded"
														/>
														<div className="flex flex-col">
															<div className="mb-1 text-lg font-semibold leading-tight">
																{event.title}
															</div>
															<div className="mb-2 text-sm">{event.date}</div>
															<div className="text-muted-foreground text-sm">
																{event.description}
															</div>
														</div>
														<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
													</Link>
												</NavigationMenuLink>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
							{navData.courses.length > 0 && (
								<NavigationMenuItem className="items-stretch">
									<NavigationMenuTrigger className="dark:bg-background relative flex h-full items-center bg-white font-normal">
										Courses
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="w-[300px] md:w-[550px] lg:w-[550px]">
											{navData.courses.map((course) => (
												<NavigationMenuLink key={course.href} asChild>
													<Link
														href={course.href}
														className="relative flex flex-row items-center gap-5 pr-8"
														onClick={() => {
															track('navigation_menu_item_click', {
																resource: course.title,
																type: 'course',
																category: 'navigation',
															})
														}}
													>
														<CldImage
															src={course.image.src}
															alt={course.image.alt}
															width={course.image.width}
															height={course.image.height}
															className="rounded"
														/>
														<div className="flex flex-col">
															<div className="text-lg font-semibold">
																{course.title}
															</div>
															<div className="text-muted-foreground text-sm">
																{course.description}
															</div>
														</div>
														<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
													</Link>
												</NavigationMenuLink>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
							<NavigationMenuItem className="items-stretch">
								<NavigationMenuTrigger className="dark:bg-background flex h-full items-center bg-white font-normal">
									Free Tutorials
								</NavigationMenuTrigger>
								<NavigationMenuContent className="w-full shrink-0 p-0">
									<div className="flex w-[300px] md:w-[550px] lg:w-[550px]">
										<NavigationMenuLink asChild>
											<Link
												href={navData.freeTutorials.featured.href}
												className="p-0! flex aspect-[3/4] max-w-[180px] flex-col items-start justify-between border-r"
												onClick={() => {
													track('navigation_menu_item_click', {
														resource: navData.freeTutorials.featured.title,
														type: 'tutorial',
														category: 'navigation',
													})
												}}
											>
												<div className="flex flex-col p-3">
													<div className="bg-primary text-primary-foreground inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium uppercase">
														{navData.freeTutorials.featured.badge}
													</div>
													<div className="mt-3 text-lg font-semibold leading-tight">
														{navData.freeTutorials.featured.title}
													</div>
													<p className="text-muted-foreground mt-2 text-sm font-normal">
														{navData.freeTutorials.featured.description}
													</p>
												</div>
												<div className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-1 py-3 font-medium">
													View Tutorial
													<ChevronRight className="text-primary-foreground size-4" />
												</div>
											</Link>
										</NavigationMenuLink>
										<ul className="divide-border flex w-full flex-col divide-y">
											{navData.freeTutorials.items.map((tutorial) => (
												<NavigationMenuLink key={tutorial.href} asChild>
													<Link
														href={tutorial.href}
														className="relative flex flex-col pl-3 pr-8 text-lg font-normal"
														onClick={() => {
															track('navigation_menu_item_click', {
																resource: tutorial.title,
																type: 'tutorial',
																category: 'navigation',
															})
														}}
													>
														<div className="text-base font-semibold leading-tight">
															{tutorial.title}
														</div>
														<p className="text-muted-foreground text-sm font-normal">
															{tutorial.description}
														</p>
														<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
													</Link>
												</NavigationMenuLink>
											))}
										</ul>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>
							{(navData.cohorts.length > 0 ||
								navData.pastCohorts.length > 0) && (
								<NavigationMenuItem className="items-stretch">
									<NavigationMenuTrigger className="dark:bg-background relative flex h-full items-center bg-white font-normal">
										<span className="relative flex items-center">Cohorts</span>
									</NavigationMenuTrigger>
									<NavigationMenuContent className="w-full shrink-0">
										<ul className="w-[300px] md:w-[550px] lg:w-[550px]">
											{navData.cohorts.length === 0 && (
												<div className="text-muted-foreground px-3 py-1.5 text-sm font-normal">
													No cohorts scheduled at the moment.
												</div>
											)}
											{navData.cohorts.map((cohort) => (
												<NavigationMenuLink key={cohort.href} asChild>
													<Link
														href={cohort.href}
														onClick={() => {
															track('navigation_menu_item_click', {
																resource: cohort.title,
																type: 'cohort',
																category: 'navigation',
															})
														}}
														className="relative flex flex-row items-center gap-5 pr-8"
													>
														<CldImage
															src={cohort.image.src}
															alt={cohort.image.alt}
															width={cohort.image.width}
															height={cohort.image.height}
															className="rounded"
														/>
														<div className="flex flex-col gap-1">
															<div className="text-lg font-semibold leading-tight">
																{cohort.title}
															</div>
															<div className="text-muted-foreground">
																{cohort.subtitle}
															</div>
														</div>
														<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
													</Link>
												</NavigationMenuLink>
											))}
										</ul>
										{navData?.pastCohorts && navData.pastCohorts.length > 0 && (
											<>
												<hr aria-hidden="true" className="mt-3 w-full" />
												<span className="text-muted-foreground block px-3 pb-2 pt-3 text-sm font-medium uppercase">
													Past Cohorts
												</span>
												<ul className="divide-border flex w-full flex-col divide-y">
													{navData.pastCohorts.map((cohort) => (
														<NavigationMenuLink key={cohort.href} asChild>
															<Link
																href={cohort.href}
																onClick={() => {
																	track('navigation_menu_item_click', {
																		resource: cohort.title,
																		type: 'cohort',
																		category: 'navigation',
																	})
																}}
																className="relative flex flex-row items-center gap-5 pr-8 opacity-75 transition hover:opacity-100"
															>
																<CldImage
																	src={cohort.image.src}
																	alt={cohort.image.alt}
																	width={cohort.image.width / 1.5}
																	height={cohort.image.height / 1.5}
																	className="rounded"
																/>
																<div className="flex flex-col">
																	<div className="text-base font-medium">
																		{cohort.title}
																	</div>
																	<div className="text-muted-foreground text-sm">
																		{cohort.subtitle}
																	</div>
																</div>
																<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
															</Link>
														</NavigationMenuLink>
													))}
												</ul>
											</>
										)}
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
							<NavigationMenuItem className="flex items-center justify-center border-r">
								<NavigationMenuLink
									className="flex h-full items-center justify-center px-4 font-normal"
									asChild
								>
									<Link
										href={navData.browseAll.href}
										onClick={() => {
											track('navigation_menu_item_click', {
												resource: navData.browseAll.label,
												type: 'browse_all',
												category: 'navigation',
											})
										}}
									>
										{navData.browseAll.label}
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
						</NavigationMenuList>
					</NavigationMenu>
					{/* {links.length > 0 && (
						<nav
							className={cn('flex items-stretch', {
								'hidden sm:flex': links.length > 3,
							})}
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="divide-border flex items-stretch sm:divide-x">
								{links.map((link, i) => {
									return (
										<NavLinkItem
											className={cn('text-base font-medium', {
												'hidden md:flex': i > 0,
											})}
											key={link.href || link.label}
											{...link}
										/>
									)
								})}
							</ul>
						</nav>
					)} */}
				</div>
				<nav className="flex items-stretch" aria-label={`User navigation`}>
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<ul className="hidden items-stretch lg:flex">
						<SessionDependentNavItems
							sessionStatus={sessionStatus}
							subscriber={subscriber}
							setIsFeedbackDialogOpen={setIsFeedbackDialogOpen}
						/>
						<UserMenu />
						<ThemeToggle className="hover:bg-muted border-l px-5" />
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

const components: { title: string; href: string; description: string }[] = [
	{
		title: 'Alert Dialog',
		href: '/docs/primitives/alert-dialog',
		description:
			'A modal dialog that interrupts the user with important content and expects a response.',
	},
	{
		title: 'Hover Card',
		href: '/docs/primitives/hover-card',
		description:
			'For sighted users to preview content available behind a link.',
	},
	{
		title: 'Progress',
		href: '/docs/primitives/progress',
		description:
			'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
	},
	{
		title: 'Scroll-area',
		href: '/docs/primitives/scroll-area',
		description: 'Visually or semantically separates content.',
	},
	{
		title: 'Tabs',
		href: '/docs/primitives/tabs',
		description:
			'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
	},
	{
		title: 'Tooltip',
		href: '/docs/primitives/tooltip',
		description:
			'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
	},
]
