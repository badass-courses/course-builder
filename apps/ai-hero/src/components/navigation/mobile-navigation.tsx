'use client'

import * as React from 'react'
import Image from 'next/image'
import { createAppAbility } from '@/ability'
import { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { LogIn, Menu, Newspaper, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { Button, Gravatar, Sheet, SheetContent } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { useNavLinks } from './use-nav-links'

type MobileNavigationProps = {
	isMobileMenuOpen: boolean
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
	subscriber?: Subscriber | null
}

/**
 * MobileNavigation component that handles the mobile menu, including user-related items
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
	isMobileMenuOpen,
	setIsMobileMenuOpen,
	subscriber,
}) => {
	const navData = useNavLinks()
	const { data: sessionData, status: sessionStatus } = useSession()
	const { setIsFeedbackDialogOpen } = useFeedback()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	const canViewTeam = ability.can('invite', 'Team')
	const canCreateContent = ability.can('create', 'Content')
	const canViewInvoice = ability.can('read', 'Invoice')
	const isAdmin = ability.can('manage', 'all')

	const userAvatar = sessionData?.user?.image ? (
		<Image
			src={sessionData.user.image}
			alt={sessionData.user.name || ''}
			width={48}
			height={48}
			className="rounded-full"
		/>
	) : (
		<Gravatar
			className="h-[48px] w-[48px] rounded-full"
			email={sessionData?.user?.email || ''}
			default="mp"
		/>
	)

	return (
		<div className="flex items-stretch md:hidden">
			<Button
				variant="ghost"
				className="h-16 w-16 items-center justify-center border-l"
				type="button"
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			>
				<Menu className="size-5" />
			</Button>
			<Sheet
				modal={false}
				onOpenChange={setIsMobileMenuOpen}
				open={isMobileMenuOpen}
			>
				<SheetContent
					side="right"
					className="bg-card overflow-y-auto px-0 py-5 [&>button>svg]:h-7 [&>button>svg]:w-7 [&>button]:flex [&>button]:h-12 [&>button]:w-12 [&>button]:items-center [&>button]:justify-center"
				>
					<nav
						aria-label="Primary Mobile Navigation"
						className="flex h-full flex-col items-start justify-between gap-2"
					>
						<div className="flex w-full flex-col">
							{sessionStatus === 'authenticated' && (
								<div className="mb-4 flex w-full flex-row items-center gap-1 border-b px-5 py-5">
									{userAvatar}
									<span className="text-xl font-bold">
										{sessionData.user.name
											? `Hey there, ${sessionData.user.name?.split(' ')[0]}`
											: 'Hey there'}
									</span>
								</div>
							)}
							{sessionStatus === 'unauthenticated' && (
								<div className="mb-4 flex w-full flex-row items-center gap-1 border-b py-3">
									{/* <div className="bg-muted flex h-16 w-16 rounded-full" /> */}
									<span className="text-xl font-bold">
										<NavLinkItem
											className=""
											label="Log in"
											icon={<LogIn className="size-4" />}
											href="/login"
										/>
									</span>
								</div>
							)}
							{sessionStatus === 'unauthenticated' && !subscriber && (
								<NavLinkItem
									href="/newsletter"
									className="mb-5 [&_span]:flex [&_span]:items-center"
									label={
										<>
											<Newspaper className="mr-2 w-3 text-indigo-600 dark:text-orange-300" />
											Newsletter
										</>
									}
								/>
							)}
							<div className="flex w-full flex-col gap-3">
								{navData.courses.length > 0 && (
									<div className="flex flex-col">
										<div className="text-muted-foreground px-5 py-2 text-xs font-semibold uppercase tracking-wider">
											Courses
										</div>
										<ul className="flex flex-col gap-1">
											{navData.courses.map((course) => (
												<NavLinkItem
													className=""
													key={course.href}
													href={course.href}
													label={course.title}
												/>
											))}
										</ul>
									</div>
								)}
								{navData.cohorts.length > 0 && (
									<div className="flex flex-col">
										<div className="text-muted-foreground px-5 py-2 text-xs font-semibold uppercase tracking-wider">
											Cohorts
										</div>
										<ul className="flex flex-col gap-1">
											{navData.cohorts.map((cohort) => (
												<NavLinkItem
													className=""
													key={cohort.href}
													href={cohort.href}
													label={cohort.title}
												/>
											))}
										</ul>
									</div>
								)}
								<div className="flex flex-col">
									<div className="text-muted-foreground px-5 py-2 text-xs font-semibold uppercase tracking-wider">
										Free Tutorials
									</div>
									<ul className="flex flex-col gap-1">
										<NavLinkItem
											className=""
											href={navData.freeTutorials.featured.href}
											label={navData.freeTutorials.featured.title}
										/>
										{navData.freeTutorials.items.map((tutorial) => (
											<NavLinkItem
												className=""
												key={tutorial.href}
												href={tutorial.href}
												label={tutorial.title}
											/>
										))}
									</ul>
								</div>
								<ul className="border-foreground/20 flex flex-col gap-1 border-t pt-2">
									<NavLinkItem
										className=""
										href={navData.browseAll.href}
										label={navData.browseAll.label}
									/>
									{sessionStatus === 'authenticated' && (
										<NavLinkItem
											className=""
											label="Send Feedback"
											onClick={() => setIsFeedbackDialogOpen(true)}
										/>
									)}

									{canViewTeam && !isAdmin && (
										<NavLinkItem
											className=""
											label="Invite Team"
											href="/team"
										/>
									)}
									{canViewInvoice && (
										<NavLinkItem
											className=""
											href="/invoices"
											label="Invoices"
										/>
									)}
									{sessionStatus === 'authenticated' && (
										<NavLinkItem className="" href="/profile" label="Profile" />
									)}
									{canCreateContent && (
										<NavLinkItem
											className=""
											href="/admin/pages"
											label="Admin"
										/>
									)}
								</ul>
							</div>
						</div>

						<div className="flex w-full flex-col items-start justify-start border-t pt-3">
							{sessionStatus === 'authenticated' && (
								<>
									<NavLinkItem
										className="pl-4"
										href="#"
										label="Log out"
										onClick={() => signOut()}
										icon={
											<ArrowRightEndOnRectangleIcon className="mr-2 h-5 w-5" />
										}
									/>
								</>
							)}
							<ThemeToggle className="text-lg [&_svg]:h-5 [&_svg]:w-5" />
						</div>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	)
}
