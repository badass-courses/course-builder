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
					className="hidden border-l font-normal lg:flex"
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

	const navSubheadingClassName =
		'text-muted-foreground border-b px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider'

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
							{(navData.learn.courses.length > 0 ||
								navData.learn.freeTutorials.items.length > 0) && (
								<NavigationMenuItem className="items-stretch">
									<NavigationMenuTrigger className="dark:bg-background relative flex h-full items-center rounded-none bg-white px-6 pr-5 font-normal [&_svg]:last-of-type:opacity-50">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											className="mr-1 size-4"
											fill="none"
											viewBox="0 0 24 24"
										>
											<path
												stroke="currentColor"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M14.453 12.895c-.151.627-.867 1.07-2.3 1.955-1.383.856-2.075 1.285-2.633 1.113a1.376 1.376 0 0 1-.61-.393c-.41-.45-.41-1.324-.41-3.07 0-1.746 0-2.62.41-3.07.17-.186.38-.321.61-.392.558-.173 1.25.256 2.634 1.112 1.432.886 2.148 1.329 2.3 1.955a1.7 1.7 0 0 1 0 .79Z"
											/>
											<path
												stroke="currentColor"
												strokeLinecap="round"
												strokeWidth="1.5"
												d="M20.998 11c.002.47.002.97.002 1.5 0 4.478 0 6.718-1.391 8.109C18.217 22 15.979 22 11.5 22c-4.478 0-6.718 0-8.109-1.391C2 19.217 2 16.979 2 12.5c0-4.478 0-6.718 1.391-8.109S7.021 3 11.5 3c.53 0 1.03 0 1.5.002"
											/>
											<path
												stroke="currentColor"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="m18.5 2 .258.697c.338.914.507 1.371.84 1.704.334.334.791.503 1.705.841L22 5.5l-.697.258c-.914.338-1.371.507-1.704.84-.334.334-.503.791-.841 1.705L18.5 9l-.258-.697c-.338-.914-.507-1.371-.84-1.704-.334-.334-.791-.503-1.705-.841L15 5.5l.697-.258c.914-.338 1.371-.507 1.704-.84.334-.334.503-.791.841-1.705L18.5 2Z"
												// opacity=".4"
												className="text-primary opacity-40 dark:opacity-100"
											/>
										</svg>
										Learn
									</NavigationMenuTrigger>
									<NavigationMenuContent className="w-full shrink-0 p-0">
										<div className="flex w-[300px] flex-col md:w-[550px] lg:w-[550px]">
											{navData.learn.courses.length > 0 && (
												<div className="border-b">
													<div className={navSubheadingClassName}>Courses</div>
													<ul className="divide-border flex w-full flex-col divide-y">
														{navData.learn.courses.map((course) => (
															<NavigationMenuLink key={course.href} asChild>
																<Link
																	href={course.href}
																	className="relative flex flex-row items-center gap-5 px-3 py-3 pr-8"
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
												</div>
											)}
											<div className={navSubheadingClassName}>
												Free Tutorials
											</div>
											<div className="flex">
												<NavigationMenuLink asChild>
													<Link
														href={navData.learn.freeTutorials.featured.href}
														className="p-0! flex aspect-[3/4] max-w-[180px] flex-col items-start justify-between border-r"
														onClick={() => {
															track('navigation_menu_item_click', {
																resource:
																	navData.learn.freeTutorials.featured.title,
																type: 'tutorial',
																category: 'navigation',
															})
														}}
													>
														<div className="flex flex-col p-3">
															{navData.learn.freeTutorials.featured.image && (
																<CldImage
																	src={
																		navData.learn.freeTutorials.featured.image
																			.src
																	}
																	alt={
																		navData.learn.freeTutorials.featured.image
																			.alt
																	}
																	width={
																		navData.learn.freeTutorials.featured.image
																			.width
																	}
																	height={
																		navData.learn.freeTutorials.featured.image
																			.height
																	}
																	className="rounded"
																/>
															)}
															{navData.learn.freeTutorials.featured.badge && (
																<div className="bg-primary text-primary-foreground inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium uppercase">
																	{navData.learn.freeTutorials.featured.badge}
																</div>
															)}
															<div className="mt-3 text-lg font-semibold leading-tight">
																{navData.learn.freeTutorials.featured.title}
															</div>
															<p className="text-muted-foreground mt-2 text-sm font-normal">
																{
																	navData.learn.freeTutorials.featured
																		.description
																}
															</p>
														</div>

														<div className="bg-primary text-primary-foreground flex w-full items-center justify-center gap-1 py-3 font-medium">
															View Tutorial
															<ChevronRight className="text-primary-foreground size-4" />
														</div>
													</Link>
												</NavigationMenuLink>
												<ul className="divide-border flex w-full flex-col divide-y">
													{navData.learn.freeTutorials.items.map((tutorial) => (
														<NavigationMenuLink key={tutorial.href} asChild>
															<Link
																href={tutorial.href}
																className="relative flex flex-col px-3 py-3 pr-8 text-lg font-normal"
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
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
							{(navData.live.events.length > 0 ||
								navData.live.cohorts.length > 0 ||
								navData.live.pastCohorts.length > 0) && (
								<NavigationMenuItem className="items-stretch">
									<NavigationMenuTrigger className="dark:bg-background relative flex h-full items-center rounded-none bg-white px-6 pr-5 font-normal [&_svg]:last-of-type:opacity-50">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											className="size-4.5 mr-1"
											fill="none"
											viewBox="0 0 24 24"
										>
											<path
												stroke="currentColor"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M15.538 18.592c-1.107.908-2.75.908-6.038.908-3.287 0-4.931 0-6.038-.908a4 4 0 0 1-.554-.554C2 16.93 2 15.288 2 12c0-3.287 0-4.931.908-6.038a4 4 0 0 1 .554-.554C4.57 4.5 6.212 4.5 9.5 4.5c3.287 0 4.931 0 6.038.908a4 4 0 0 1 .554.554C17 7.07 17 8.712 17 12c0 3.287 0 4.931-.908 6.038a4.001 4.001 0 0 1-.554.554Z"
											/>
											<path
												stroke="currentColor"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M17 13v-2l2.6-3.467a1.333 1.333 0 0 1 2.4.8v7.334a1.333 1.333 0 0 1-2.4.8L17 13Zm-7.5.5a1.5 1.5 0 0 0 0-3m0 3a1.5 1.5 0 0 1 0-3m0 3v-3"
												// opacity=".4"
												className="text-primary opacity-40 dark:opacity-100"
											/>
										</svg>
										Live
									</NavigationMenuTrigger>
									<NavigationMenuContent className="w-full shrink-0 p-0">
										<div className="flex w-[300px] flex-col md:w-[550px] lg:w-[550px]">
											{navData.live.events.length > 0 && (
												<div className="border-b">
													<div className={navSubheadingClassName}>Events</div>
													<ul className="divide-border flex w-full flex-col divide-y">
														{navData.live.events.map((event) => (
															<NavigationMenuLink key={event.href} asChild>
																<Link
																	href={event.href}
																	className="relative flex flex-row items-center gap-5 px-3 py-3 pr-8"
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
																		<div className="mb-2 text-sm">
																			{event.date}
																		</div>
																		<div className="text-muted-foreground text-sm">
																			{event.description}
																		</div>
																	</div>
																	<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
																</Link>
															</NavigationMenuLink>
														))}
													</ul>
												</div>
											)}
											{(navData.live.cohorts.length > 0 ||
												navData.live.pastCohorts.length > 0) && (
												<>
													<div className={navSubheadingClassName}>Cohorts</div>
													{navData.live.cohorts.length === 0 &&
														navData.live.pastCohorts.length > 0 && (
															<div className="text-muted-foreground mt-3 px-3 text-sm font-normal">
																No cohorts scheduled at the moment.
															</div>
														)}
													{navData.live.cohorts.length > 0 && (
														<ul className="divide-border flex w-full flex-col divide-y">
															{navData.live.cohorts.map((cohort) => (
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
																		className="relative flex flex-row items-center gap-5 px-3 py-3 pr-8"
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
													)}
													{navData.live.pastCohorts.length > 0 && (
														<>
															<hr aria-hidden="true" className="mt-3 w-full" />
															<span className={navSubheadingClassName}>
																Past Cohorts
															</span>
															<ul className="divide-border flex w-full flex-col divide-y">
																{navData.live.pastCohorts.map((cohort) => (
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
																			className="relative flex flex-row items-center gap-5 px-3 py-3 pr-8 opacity-75 transition hover:opacity-100"
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
												</>
											)}
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
							<NavigationMenuItem className="flex items-center justify-center border-r">
								<NavigationMenuLink
									className="text-foreground flex h-full flex-row items-center justify-center px-6 font-normal"
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
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="size-4.5 mr-1"
											width="24"
											height="24"
											fill="none"
											viewBox="0 0 24 24"
										>
											<path
												stroke="currentColor"
												strokeLinecap="round"
												strokeWidth="1.5"
												d="M11.5 21c-4.478 0-6.718 0-8.109-1.391C2 18.217 2 15.979 2 11.5c0-4.478 0-6.718 1.391-8.109S7.021 2 11.5 2c4.478 0 6.718 0 8.109 1.391S21 7.021 21 11.5"
											/>
											<path
												stroke="currentColor"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M2 7h19"
											/>
											<path
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M10 16h1m-5 0h1"
												opacity=".4"
											/>
											<path
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M10 12h4m-8 0h1"
											/>
											<path
												className="text-primary"
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="1.5"
												d="M20.4 20.4 22 22m-.8-4.4a3.6 3.6 0 1 0-7.2 0 3.6 3.6 0 0 0 7.2 0Z"
												// opacity=".4"
											/>
										</svg>
										<span>{navData.browseAll.label}</span>
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
