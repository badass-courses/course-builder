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

import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'

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
	const { data: sessionData, status: sessionStatus, update } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	const canManageAll = ability.can('manage', 'all')

	// Check if we're impersonating
	const isImpersonating = Boolean(sessionData?.user?.impersonatingFromUserId)

	if (!sessionData?.user?.email) {
		return null
	}

	const userAvatar = sessionData.user.image ? (
		<Image
			src={sessionData.user.image}
			alt={sessionData.user.name || ''}
			width={28}
			height={28}
			className="rounded-full"
		/>
	) : (
		<Gravatar
			className="h-7 w-7 rounded-full"
			email={sessionData.user.email || ''}
			default="mp"
		/>
	)

	return (
		<div className="absolute right-0 flex items-stretch md:hidden">
			<Button
				variant="ghost"
				className="flex h-full items-center justify-center"
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
							{sessionStatus === 'authenticated' && (
								<div
									className={cn(
										'mb-4 flex w-full flex-col items-center gap-1 border-b px-5 py-5',
										isImpersonating && 'border-orange-200 bg-orange-50',
									)}
								>
									{isImpersonating && (
										<div className="mb-2 text-sm font-medium text-orange-600">
											🎭 Impersonating
										</div>
									)}
									{userAvatar}
									<span className="text-xl font-bold">
										{sessionData.user.name?.split(' ')[0] || ''}
									</span>
									{isImpersonating && (
										<div className="text-muted-foreground text-center text-sm">
											<div>{sessionData.user.email}</div>
											<div className="text-xs">
												Role: {sessionData.user.role}
											</div>
										</div>
									)}
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
								{canManageAll && (
									<NavLinkItem
										className=""
										href="/admin/dashboard"
										label="Admin"
									/>
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
