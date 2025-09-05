'use client'

import * as React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { Menu, Newspaper, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { Button, Gravatar, Sheet, SheetContent } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { Logo } from '../brand/logo'
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
	const isAdmin = ability.can('manage', 'all')

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

	const isEditRoute = usePathname().includes('/edit')

	return (
		<div
			className={cn('flex items-stretch lg:hidden', {
				'fixed right-6 top-2': !isEditRoute,
				'absolute -top-5 right-0': isEditRoute,
			})}
		>
			<Button
				variant="ghost"
				data-mobile-nav-trigger=""
				className="ring-gray-800/7.5 bg-card/80 text-foreground flex h-12 w-12 items-center justify-center rounded-lg p-0 shadow-sm ring-1 backdrop-blur-md"
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
					className="bg-card px-0 py-5 [&>button>svg]:h-7 [&>button>svg]:w-7 [&>button]:flex [&>button]:h-12 [&>button]:w-12 [&>button]:items-center [&>button]:justify-center"
				>
					<nav
						aria-label="Primary Mobile Navigation"
						className="flex h-full flex-col items-start justify-between gap-2"
					>
						<div className="flex w-full flex-col">
							<Logo className="mb-10 origin-top-left scale-[1.2] pl-5 pt-1" />
							{sessionStatus === 'authenticated' && (
								<div className="mb-4 flex w-full flex-col items-center gap-1 border-b px-5 py-5">
									{userAvatar}
									<span className="text-xl font-semibold">
										{sessionData.user.name?.split(' ')[0] || ''}
									</span>
								</div>
							)}
							<ul className="flex flex-col gap-1 px-5">
								{links.map((link) => (
									<NavLinkItem
										className="[&_span]:flex [&_span]:items-center"
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

								{canViewTeam && !isAdmin && (
									<NavLinkItem className="" label="Invite Team" href="/team" />
								)}
								{canViewInvoice && (
									<NavLinkItem className="" href="/invoices" label="Invoices" />
								)}
								{sessionStatus === 'authenticated' && (
									<NavLinkItem className="" href="/profile" label="Profile" />
								)}
								{canCreateContent && (
									<NavLinkItem
										className=""
										href="/admin/coupons"
										label="Admin"
									/>
								)}
								{sessionStatus === 'unauthenticated' && (
									<NavLinkItem label="Sign in" href="/login" />
								)}
							</ul>
						</div>
						{sessionStatus === 'authenticated' && (
							<>
								<div className="flex w-full flex-col items-start justify-start border-t px-5 pt-3">
									<NavLinkItem
										className="pl-4"
										href="#"
										label="Log out"
										onClick={() => signOut()}
										icon={
											<ArrowRightEndOnRectangleIcon className="mr-2 h-5 w-5" />
										}
									/>
									{/* <ThemeToggle className="text-lg [&_svg]:h-5 [&_svg]:w-5" /> */}
								</div>
							</>
						)}
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	)
}
