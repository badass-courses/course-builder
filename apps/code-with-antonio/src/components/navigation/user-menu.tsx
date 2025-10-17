'use client'

import * as React from 'react'
import Image from 'next/image'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Gravatar,
	Skeleton,
} from '@coursebuilder/ui'

import { NavLinkItem } from './nav-link-item'

/**
 * Desktop user menu component with dropdown
 */
export const UserMenu = () => {
	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])

	const canViewTeam = ability.can('invite', 'Team')
	const canCreateContent = ability.can('create', 'Content')
	const canViewInvoice = ability.can('read', 'Invoice')
	const isAdmin = ability.can('manage', 'all')

	if (sessionStatus === 'loading') {
		return (
			<div className="flex items-stretch">
				<div className="flex h-full items-center justify-center px-5">
					<Skeleton className="bg-foreground/10 h-2 w-10 rounded" />
				</div>
			</div>
		)
	}

	if (!sessionData?.user?.email) {
		return <NavLinkItem className="" label="Log in" href="/login" />
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
			email={sessionData.user.email}
			default="mp"
		/>
	)

	return (
		<>
			{canViewTeam && !isAdmin && (
				<NavLinkItem label="Invite Team" href="/team" />
			)}
			<li className="hidden shrink-0 items-stretch sm:flex">
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger className="hover:bg-muted flex items-center gap-1 rounded-lg px-2 text-sm font-medium">
						{userAvatar}
						<span className="w-full max-w-[20ch] truncate overflow-ellipsis">
							{sessionData.user.name?.split(' ')[0] || 'Account'}
						</span>
						<ChevronDownIcon className="size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>
							{sessionData.user.email || 'Account'}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<ul className="flex flex-col">
							{canViewInvoice && (
								<NavLinkItem variant="menu" href="/invoices" label="Invoices" />
							)}
							<NavLinkItem variant="menu" href="/profile" label="Profile" />
							{canCreateContent && (
								<NavLinkItem
									variant="menu"
									href="/admin/dashboard"
									label="Admin"
								/>
							)}
							<hr className="my-1" />
							<NavLinkItem
								variant="menu"
								href="#"
								label="Log out"
								onClick={() => signOut()}
								icon={<ArrowRightEndOnRectangleIcon className="mr-2 h-4 w-4" />}
							/>
						</ul>
					</DropdownMenuContent>
				</DropdownMenu>
			</li>
		</>
	)
}
