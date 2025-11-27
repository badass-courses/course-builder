'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { ActiveEventButton } from '@/app/(content)/events/_components/active-event'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ChevronRight, Menu, Newspaper, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	Button,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { Logo } from '../brand/logo'
import { CldImage } from '../cld-image'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

const Navigation = ({
	withContainer,
	className,
}: {
	withContainer?: boolean
	className?: string
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
	const navData = useNavLinks()

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
				'h-(--nav-height) bg-card relative z-50 mb-3 flex w-full items-center justify-between print:hidden',
				{
					// 'px-5': !withContainer,
				},
				className,
			)}
		>
			<div className="items-cener mx-auto flex w-full max-w-[1200px] justify-between px-6 sm:px-10">
				<div className="bg-linear-to-r absolute inset-x-0 -top-6 -z-10 h-12 -rotate-3 from-violet-300 via-pink-300 to-sky-300 opacity-50 blur-3xl dark:opacity-40" />
				<div
					className={cn('relative flex w-full items-stretch justify-between', {
						// container: !isEditRoute,
					})}
				>
					<div className="flex items-stretch">
						<span
							data-logo=""
							className="flex items-center justify-center border-r"
							// onContextMenu={(e) => {
							// 	e.preventDefault()
							// 	router.push('/brand')
							// }}
						>
							<Button
								asChild
								variant="ghost"
								className="hover:bg-violet-300/10! h-12 rounded-none p-0 pl-1.5 text-lg"
							>
								<Link
									data-nav-link=""
									prefetch
									tabIndex={isRoot ? -1 : 0}
									href="/"
									className="font-heading flex items-center justify-center pr-3 text-xl font-semibold leading-none transition"
								>
									<Logo className="origin-left scale-[1]" />
								</Link>
							</Button>
						</span>
						<NavigationMenu
							delayDuration={0}
							skipDelayDuration={0}
							viewport={true}
							className="hidden items-stretch md:flex"
						>
							<NavigationMenuList className="divide-border flex h-full items-stretch gap-0 divide-x">
								{navData.courses.length > 0 && (
									<NavigationMenuItem className="items-stretch">
										<NavigationMenuTrigger className="dark:hover:bg-foreground/5 data-[state='open']:bg-white! dark:data-[state='open']:bg-foreground/5! relative flex h-full items-center rounded-none bg-transparent font-normal hover:bg-white">
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
																<div className="text-lg font-semibold leading-tight">
																	{course.title}
																</div>
																<div className="text-muted-foreground mt-1 text-sm">
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
								{(navData.cohorts.length > 0 ||
									navData.pastCohorts.length > 0) && (
									<NavigationMenuItem className="items-stretch">
										<NavigationMenuTrigger className="dark:hover:bg-foreground/5 data-[state='open']:bg-white! dark:data-[state='open']:bg-foreground/5! relative flex h-full items-center rounded-none bg-transparent font-normal hover:bg-white">
											Cohorts
										</NavigationMenuTrigger>
										<NavigationMenuContent className="w-full shrink-0">
											<ul className="w-[300px] md:w-[550px] lg:w-[550px]">
												{navData?.cohorts?.map((cohort) => (
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
											{navData?.pastCohorts &&
												navData.pastCohorts.length > 0 && (
													<>
														{navData.cohorts.length > 0 && (
															<hr aria-hidden="true" className="mt-3 w-full" />
														)}
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
										className="dark:hover:bg-foreground/5 rounded-none! relative flex h-full items-center justify-center bg-transparent px-4 font-normal hover:bg-white"
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
							className={cn(
								// 'ring-gray-800/7.5 absolute items-center rounded-full border border-white/50 bg-white/50 px-1 text-sm font-medium text-gray-800 shadow-lg shadow-gray-800/5 ring-1 backdrop-blur-xl dark:border-white/5 dark:bg-white/5',
								{
									'hidden h-full items-stretch lg:flex': true, // links.length > 3,
								},
							)}
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="divide-border flex h-full items-stretch divide-x">
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
					)} */}
					</div>
					<nav
						className="absolute right-0 flex h-full items-stretch"
						aria-label={`User navigation`}
					>
						{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
						<div className="flex items-center pr-5">
							<Button asChild size="sm" className="h-8">
								<Link href="/#buy">Get Access</Link>
							</Button>
						</div>
					)} */}
						<ul className="divide-border hidden h-full items-stretch divide-x lg:flex">
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
							{/* <ActiveEventButton className="flex items-center pl-2" /> */}
							{/* <ThemeToggle className="" /> */}
						</ul>
					</nav>
					<MobileNavigation
						isMobileMenuOpen={isMobileMenuOpen}
						setIsMobileMenuOpen={setIsMobileMenuOpen}
						subscriber={subscriber}
					/>
				</div>
			</div>
		</header>
	)
}

export default Navigation
