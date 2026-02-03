'use client'

import * as React from 'react'
import Image from 'next/image'
import { createAppAbility, User } from '@/ability'
import { Subscriber } from '@/schemas/subscriber'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import {
	CircleDollarSign,
	FileText,
	Lightbulb,
	ListChecks,
	Menu,
	Newspaper,
	User as UserIcon,
	Users,
	X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

import { Button, Gravatar, Sheet, SheetContent } from '@coursebuilder/ui'

import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'

type MobileNavigationProps = {
	isMobileMenuOpen: boolean
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
	subscriber?: Subscriber | null
	user?: User | null
}

/**
 * MobileNavigation component that handles the mobile menu, including user-related items
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
	isMobileMenuOpen,
	setIsMobileMenuOpen,
	subscriber,
	user,
}) => {
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	const canManageAll = ability.can('manage', 'all')

	// Check if we're impersonating
	const isImpersonating = Boolean(user?.impersonatingFromUserId)

	if (!user?.email) {
		return null
	}

	const userAvatar = user.image ? (
		<Image
			src={user.image}
			alt={user.name || ''}
			width={28}
			height={28}
			className="rounded-full"
		/>
	) : (
		<Gravatar
			className="h-7 w-7 rounded-full"
			email={user.email || ''}
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
							<div
								className={cn(
									'mb-4 flex w-full flex-col items-center gap-1 border-b px-5 py-5',
									isImpersonating &&
										'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
								)}
							>
								{isImpersonating && (
									<div className="mb-2 text-sm font-medium text-orange-600 dark:text-orange-400">
										🎭 Impersonating
									</div>
								)}
								{userAvatar}
								<span className="text-xl font-bold">
									{user.name?.split(' ')[0] || ''}
								</span>
								{isImpersonating && (
									<div className="text-muted-foreground text-center text-sm">
										<div>{user.email}</div>
										<div className="text-xs">
											Role:{' '}
											{user.roles?.map((r: any) => r.name).join(', ') ||
												user.role ||
												'user'}
										</div>
									</div>
								)}
							</div>
							{!subscriber && (
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
									<>
										<NavLinkItem
											className=""
											href="/dashboard"
											label="Instructor Dashboard"
											icon={<UserIcon className="mr-2 h-4 w-4" />}
										/>
										<NavLinkItem
											className=""
											href="/admin/pages"
											label="Admin Pages"
											icon={<FileText className="mr-2 h-4 w-4" />}
										/>
										<NavLinkItem
											className=""
											href="/admin/posts"
											label="Admin Posts"
											icon={<ListChecks className="mr-2 h-4 w-4" />}
										/>
										<NavLinkItem
											className=""
											href="/admin/tips"
											label="Admin Tips"
											icon={<Lightbulb className="mr-2 h-4 w-4" />}
										/>
										<NavLinkItem
											className=""
											href="/admin/contributors"
											label="Admin Contributors"
											icon={<Users className="mr-2 h-4 w-4" />}
										/>
										<NavLinkItem
											className=""
											href="/admin/products"
											label="Admin Products"
											icon={<CircleDollarSign className="mr-2 h-4 w-4" />}
										/>
									</>
								)}
							</ul>
						</div>

						<div className="flex w-full flex-col items-start justify-start border-t pt-3">
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
							<ThemeToggle className="text-lg [&_svg]:h-5 [&_svg]:w-5" />
						</div>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	)
}
