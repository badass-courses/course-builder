'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Gravatar,
	Skeleton,
} from '@coursebuilder/ui'

import { NavLinkItem } from './nav-link-item'

type UserNavigationProps = {
	variant: 'mobile' | 'desktop'
	className?: string
}

/**
 * UserNavigation component that handles both mobile and desktop user navigation
 * Including the avatar, menu items, and authentication state
 */
export const UserNavigation: React.FC<UserNavigationProps> = ({
	variant,
	className,
}) => {
	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)
	const isLoadingUserInfo = sessionStatus === 'loading'
	const canViewTeam = ability.can('invite', 'Team')
	const canCreateContent = ability.can('create', 'Content')
	const canViewInvoice = ability.can('read', 'Invoice')

	if (isLoadingUserInfo) {
		return (
			<div className="flex items-stretch">
				<div className="flex h-full items-center justify-center px-5">
					<Skeleton className="bg-foreground/10 h-2 w-10 rounded" />
				</div>
			</div>
		)
	}

	if (!sessionData?.user?.email) {
		return (
			<NavLinkItem
				className={cn('text-base', variant === 'mobile' && 'text-xl')}
				label="Login"
				href="/login"
			/>
		)
	}

	const userAvatar = (
		<>
			{sessionData.user.image ? (
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
					email={sessionData.user.email}
					default="mp"
				/>
			)}
		</>
	)

	const menuItems = (
		<ul className="flex flex-col gap-2">
			{canViewInvoice && (
				<NavLinkItem
					variant="menu"
					href="/invoices"
					label="Invoices"
					className={variant === 'mobile' ? 'text-xl' : ''}
				/>
			)}
			<NavLinkItem
				variant="menu"
				href="/profile"
				label="Profile"
				className={variant === 'mobile' ? 'text-xl' : ''}
			/>
			{canCreateContent && (
				<NavLinkItem
					variant="menu"
					href="/admin/dashboard"
					label="Admin"
					className={variant === 'mobile' ? 'text-xl' : ''}
				/>
			)}
			<hr className="my-1" />
			<NavLinkItem
				variant="menu"
				href="#"
				label="Log out"
				onClick={() => signOut()}
				icon={<ArrowRightEndOnRectangleIcon className="ml-2 h-4 w-4" />}
				className={variant === 'mobile' ? 'text-xl' : ''}
			/>
		</ul>
	)

	if (variant === 'mobile') {
		return (
			<>
				{canViewTeam && (
					<NavLinkItem className="text-xl" label="Invite Team" href="/team" />
				)}
				<div className="flex w-full flex-col">
					<div className="flex items-center px-5 py-2">
						{userAvatar}
						<span className="ml-2 text-sm">
							{sessionData.user.name?.split(' ')[0] || 'Account'}
						</span>
					</div>
					{menuItems}
				</div>
			</>
		)
	}

	return (
		<>
			{canViewTeam && <NavLinkItem label="Invite Team" href="/team" />}
			<li className="hidden items-stretch sm:flex">
				<DropdownMenu>
					<DropdownMenuTrigger
						className={cn(
							'hover:bg-muted flex items-center space-x-1 border-l px-5',
							className,
						)}
					>
						{userAvatar}
						<div className="flex flex-col pl-0.5">
							<span className="text-foreground-muted inline-flex items-center gap-0.5 text-sm leading-tight">
								<span className="truncate sm:max-w-[8rem] lg:max-w-[11rem] xl:max-w-none">
									{sessionData.user.name?.split(' ')[0] || 'Account'}
								</span>
								<ChevronDownIcon className="w-2" />
							</span>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>
							{sessionData.user.email || 'Account'}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{menuItems}
					</DropdownMenuContent>
				</DropdownMenu>
			</li>
		</>
	)
}
