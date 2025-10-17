'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { useSaleToastNotifier } from '@/hooks/use-sale-toast-notifier'
import { api } from '@/trpc/react'
import { track } from '@/utils/analytics'
import { cn } from '@/utils/cn'
import { ChevronRight, SearchIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'

import {
	Input,
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { LogoMark } from '../brand/logo'
import { LogoVideo } from './logo-video'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'
import { UserMenu } from './user-menu'

const Navigation = ({ className }: { className?: string }) => {
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
		const query = formData.get('query')?.toString().trim()

		if (!query) return

		track('search_submitted', {
			query,
			location: 'navigation',
		})

		startSearchTransition(() => {
			router.push(`/browse?q=${encodeURIComponent(query)}`)
		})
	}

	const showSearch = pathname !== '/browse'

	return (
		<header
			className={cn(
				'dark:border-border relative z-50 w-full shadow-sm dark:shadow-[0_1px_0_0_var(--border)]',
				className,
			)}
		>
			<div className="container flex items-center justify-between">
				<div className="flex items-center">
					<LogoVideo isRoot={isRoot} />
					<NavigationMenu
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
									<NavigationMenuContent className="w-full shrink-0">
										<ul className="w-[300px] md:w-[550px] lg:w-[550px]">
											{navData.browse.items.map((item) => (
												<NavigationMenuLink key={item.href} asChild>
													<Link
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
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
						</NavigationMenuList>
					</NavigationMenu>
					{showSearch && (
						<form
							className="relative flex w-full max-w-xs shrink-0"
							onSubmit={handleSearch}
						>
							<SearchIcon className="text-muted-foreground absolute left-6 top-1/2 size-4 -translate-y-1/2" />
							<Input
								name="query"
								placeholder="What do you want to learn today?"
								className="bg-input border-border ml-3 w-full rounded-full border pl-10"
								type="search"
								disabled={isSearching}
								// onChange={(event) => refine(event.currentTarget.value)}
								// defaultValue={queryParam || ''}
							/>
						</form>
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
					<ul className="hidden items-stretch md:flex">
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
