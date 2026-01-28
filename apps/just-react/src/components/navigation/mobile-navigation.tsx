'use client'

import * as React from 'react'
import Image from 'next/image'
import { createAppAbility } from '@/ability'
import { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { Menu, Newspaper, X } from 'lucide-react'
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
				className="flex aspect-square h-full shrink-0 items-center justify-center p-0"
				type="button"
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			>
				{!isMobileMenuOpen ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="size-6"
						fill="none"
						viewBox="0 0 20 16"
					>
						<path
							fill="currentColor"
							d="M1 2.625a.404.404 0 0 0-.253.119A.369.369 0 0 0 .642 3c0 .095.038.187.105.256A.4.4 0 0 0 1 3.375 146.278 146.278 0 0 0 14.5 4c1.2 0 2.4-.133 3.6-.4.3-.067.6-.142.9-.225a.487.487 0 0 0 .23-.136.357.357 0 0 0 .096-.239.357.357 0 0 0-.095-.24.487.487 0 0 0-.231-.135c-.3-.083-.6-.158-.9-.225-1.2-.267-2.4-.4-3.6-.4A146.278 146.278 0 0 0 1 2.625Zm0 10a.404.404 0 0 0-.253.119.369.369 0 0 0-.105.256c0 .095.038.187.105.256a.4.4 0 0 0 .253.119A146.302 146.302 0 0 0 14.5 14c1.2 0 2.4-.133 3.6-.4.3-.067.6-.142.9-.225a.487.487 0 0 0 .23-.136.357.357 0 0 0 .096-.239.357.357 0 0 0-.095-.24.487.487 0 0 0-.231-.135c-.3-.083-.6-.158-.9-.225-1.2-.267-2.4-.4-3.6-.4a146.302 146.302 0 0 0-13.5.625Zm18-5c.095.009.186.05.253.119a.37.37 0 0 1 .105.256.369.369 0 0 1-.105.256.404.404 0 0 1-.253.119A146.278 146.278 0 0 1 5.5 9c-1.2 0-2.4-.133-3.6-.4-.3-.067-.6-.142-.9-.225a.486.486 0 0 1-.23-.136A.357.357 0 0 1 .672 8c0-.087.035-.172.096-.24A.486.486 0 0 1 1 7.626c.3-.083.6-.158.9-.225C3.1 7.133 4.3 7 5.5 7a146.278 146.278 0 0 1 13.5.625Z"
						/>
					</svg>
				) : (
					<X className="size-6" />
				)}
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
								<div className="mb-4 flex w-full flex-row items-center gap-1 border-b py-5">
									{/* <div className="bg-muted flex h-16 w-16 rounded-full" /> */}
									<span className="text-xl font-bold">
										<NavLinkItem
											className=""
											icon={
												<div className="border-primary mr-3 flex h-12 w-12 rounded-full border border-dashed" />
											}
											label="Login"
											href="/login"
										/>
									</span>
								</div>
							)}
							{sessionStatus === 'unauthenticated' && !subscriber && (
								<NavLinkItem
									href="/newsletter"
									className="[&_span]:flex [&_span]:items-center"
									label={
										<>
											<Newspaper className="mr-2 w-3 text-indigo-600 dark:text-orange-300" />
											Newsletter
										</>
									}
								/>
							)}
							<div className="flex w-full flex-col gap-3">
								{navData.browse.items.length > 0 && (
									<div className="flex flex-col">
										<div className="text-muted-foreground px-5 py-2 text-xs font-semibold uppercase tracking-wider">
											Courses
										</div>
										<ul className="flex flex-col gap-1">
											{navData.browse.items.map((course) => (
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

								<ul className="border-foreground/20 flex flex-col gap-1 border-t pt-2">
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
