'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { useSaleToastNotifier } from '@/hooks/use-sale-toast-notifier'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ChevronRight, SearchIcon, SettingsIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Countdown from 'react-countdown'

import {
	Badge,
	Input,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { LogoMark } from '../brand/logo'
import { CldImage } from '../cld-image'
import { ContributorImage } from '../contributor'
import { FeaturedCountdown } from './countdown'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ScrambleText, type ScrambleTextHandle } from './scramble-text'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

const Navigation = ({
	className,
	withContainer = true,
}: {
	className?: string
	withContainer?: boolean
}) => {
	const navData = useNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()
	const { setIsFeedbackDialogOpen } = useFeedback()

	const isLessonRoute = params.lesson && params.module

	const scrambleRef = React.useRef<ScrambleTextHandle>(null)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	// useLiveEventToastNotifier()
	useSaleToastNotifier()

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	const [isSearching, startSearchTransition] = React.useTransition()

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)
		// Two inputs share the same name (desktop/mobile), get the non-empty one
		const queries = formData.getAll('query')
		const query = queries
			.map((q) => (typeof q === 'string' ? q.trim() : ''))
			.find(Boolean)

		if (!query) return

		track('search_submitted', {
			query,
			location: 'navigation',
		})

		startSearchTransition(() => {
			router.push(`/browse?q=${encodeURIComponent(query)}`)
		})
	}

	const showSearch = false // pathname !== '/browse'
	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])
	const isAdmin = ability.can('manage', 'all')

	return (
		<header
			className={cn(
				'flex h-[var(--nav-height)] w-full items-center justify-between',
			)}
		>
			<div
				className={cn('flex w-full items-center justify-between', {
					container: withContainer,
					'px-5': !withContainer,
				})}
			>
				<Link
					href="/"
					className="relative flex items-center justify-center p-2 px-5"
					onMouseEnter={() => scrambleRef.current?.trigger()}
				>
					<svg
						className="w-18 group pointer-events-none absolute"
						xmlns="http://www.w3.org/2000/svg"
						// width="144"
						// height="49"
						fill="none"
						viewBox="0 0 144 49"
					>
						<path
							className="group-hover:text-primary text-foreground/50 transition"
							stroke="currentColor"
							strokeWidth="4"
							d="M129 10.25h13v29h-13M15 10H2v29h13"
						/>
					</svg>
					<ScrambleText
						ref={scrambleRef}
						text="TUIS"
						className="font-mono text-lg font-semibold tracking-wider"
					/>
				</Link>
				<div className="flex items-center">
					{/* <NavigationMenu
						delayDuration={0}
						skipDelayDuration={0}
						viewport={true}
						className="ml-3 hidden items-center md:flex"
					>
						<NavigationMenuList className="divide-border flex h-full items-center gap-0 divide-x">
							{navData.browse.items.length > 0 && (
								<NavigationMenuItem className="items-center">
									<NavigationMenuTrigger className="flex items-center">
										Browse
									</NavigationMenuTrigger>
									<NavigationMenuContent className="w-full shrink-0 p-5">
										<div className="grid w-[300px] grid-cols-5 gap-3 md:w-[550px] lg:w-[550px]">
											<NavigationMenuLink
												asChild
												className="border-border col-span-2 overflow-hidden border p-0"
											>
												{navData.browse.featured &&
													navData.browse.featured?.type &&
													navData.browse.featured?.slug && (
														<Link
															prefetch
															href={getResourcePath(
																navData.browse.featured.type,
																navData.browse.featured.slug,
															)}
															className="flex flex-col justify-between"
														>
															<div className="flex flex-col gap-1 p-4">
																{navData.browse.featured.metadata && (
																	<div className="text-xs font-medium opacity-80">
																		{navData.browse.featured.metadata}
																	</div>
																)}
																{navData.browse.featured.image && (
																	<div className="relative mb-2 aspect-video">
																		<CldImage
																			src={navData.browse.featured.image}
																			alt={navData.browse.featured.title}
																			fill
																			className="rounded-lg object-cover"
																		/>
																	</div>
																)}
																<div className="line-clamp-3 text-lg font-semibold leading-tight">
																	{navData.browse.featured.title}
																</div>
															</div>

															{navData.browse.featured.badge && (
																<div className="bg-primary text-primary-foreground flex w-full justify-between px-5 pt-2">
																	<div className="flex flex-col">
																		<div className="text-lg font-semibold">
																			{navData.browse.featured.badge}
																		</div>
																		<div className="tex-sm">
																			{navData.browse.featured.expires && (
																				<>
																					Offer ends in{' '}
																					<FeaturedCountdown
																						expires={
																							navData.browse.featured.expires
																						}
																					/>
																				</>
																			)}
																		</div>
																	</div>
																	<ContributorImage />
																</div>
															)}
														</Link>
													)}
											</NavigationMenuLink>
											<ul className="col-span-3">
												{navData.browse.items.map((item) => (
													<NavigationMenuLink key={item.href} asChild>
														<Link
															prefetch
															href={item.href}
															onClick={() => {
																track('navigation_menu_item_click', {
																	resource: item.title,
																	type: 'cohort',
																	category: 'navigation',
																})
															}}
															className="relative flex flex-row items-center gap-5 pr-8"
														>
															<div className="flex flex-col">
																<div className="text-lg font-semibold">
																	{item.title}
																</div>
																<div className="text-muted-foreground">
																	{item.description}
																</div>
															</div>
															<ChevronRight className="text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
														</Link>
													</NavigationMenuLink>
												))}
											</ul>
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
						</NavigationMenuList>
					</NavigationMenu> */}
					{showSearch && (
						<form
							className="relative flex w-full max-w-xs sm:shrink-0"
							onSubmit={handleSearch}
						>
							<SearchIcon className="text-muted-foreground absolute left-6 top-1/2 size-4 -translate-y-1/2" />
							<Input
								name="query"
								placeholder="What do you want to learn today?"
								className="bg-input border-border ml-3 hidden w-full rounded-full border pl-10 sm:flex"
								type="search"
								disabled={isSearching}
							/>
							<Input
								name="query"
								placeholder="Search"
								className="bg-input border-border ml-3 flex w-full rounded-full border pl-10 sm:hidden"
								type="search"
								disabled={isSearching}
							/>
							<button type="submit" className="sr-only">
								Search
							</button>
						</form>
					)}
				</div>
				<nav className="flex items-center" aria-label={`User navigation`}>
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<ul className="hidden items-center gap-2 md:flex">
						{sessionStatus === 'authenticated' &&
							isAdmin &&
							abilityStatus !== 'pending' && (
								<NavLinkItem
									label="Admin"
									href="/admin/pages"
									icon={<SettingsIcon className="size-4" />}
									className="gap-1 [&_svg]:opacity-75"
								/>
							)}
						{sessionStatus === 'authenticated' &&
							!isAdmin &&
							abilityStatus !== 'pending' && (
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
								className="rounded-none border-l [&_span]:flex [&_span]:items-center"
								label={
									<>
										<Newspaper className="mr-2 w-3 text-indigo-600 dark:text-orange-300" />
										Newsletter
									</>
								}
							/>
						)} */}
						<UserMenu />
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
