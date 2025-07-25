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
	const links = useNavLinks()
	const { data: sessionData, status: sessionStatus } = useSession()
	const { setIsFeedbackDialogOpen } = useFeedback()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	const canViewTeam = ability.can('invite', 'Team')
	const canCreateContent = ability.can('create', 'Content')
	const canViewInvoice = ability.can('read', 'Invoice')

	const userAvatar = sessionData?.user?.image ? (
		<Image
			src={sessionData.user.image}
			alt={sessionData.user.name || ''}
			width={80}
			height={80}
			className="rounded-full"
		/>
	) : (
		<Gravatar
			className="h-20 w-20 rounded-full"
			email={sessionData?.user?.email || ''}
			default="mp"
		/>
	)

	return (
		<div className="flex items-stretch sm:hidden">
			<Button
				variant="ghost"
				className="flex h-full items-center justify-center border-l px-5"
				type="button"
				onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
			>
				{!isMobileMenuOpen ? (
					<Menu className="h-5 w-5" />
				) : (
					<X className="h-5 w-5" />
				)}
			</Button>
			<Sheet onOpenChange={setIsMobileMenuOpen} open={isMobileMenuOpen}>
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
								<div className="mb-4 flex w-full flex-col items-center gap-1 border-b px-5 py-5">
									{userAvatar}
									<span className="text-xl font-bold">
										{sessionData.user.name?.split(' ')[0] || ''}
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
							<ul className="flex flex-col gap-1">
								{links.map((link) => (
									<NavLinkItem
										className=""
										key={link.href || link.label}
										{...link}
									/>
								))}
								{sessionStatus === 'authenticated' && (
									<NavLinkItem
										className=""
										label="Send Feedback"
										onClick={() => setIsFeedbackDialogOpen(true)}
									/>
								)}

								{canViewTeam && (
									<NavLinkItem className="" label="Invite Team" href="/team" />
								)}
								{canViewInvoice && (
									<NavLinkItem className="" href="/invoices" label="Invoices" />
								)}
								{sessionStatus === 'authenticated' && (
									<NavLinkItem className="" href="/profile" label="Profile" />
								)}
								{canCreateContent && (
									<NavLinkItem className="" href="/admin/pages" label="Admin" />
								)}
							</ul>
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
