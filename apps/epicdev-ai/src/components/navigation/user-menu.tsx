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
		return <NavLinkItem className="rounded-md" label="Sign in" href="/login" />
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
			{canViewTeam && (
				<NavLinkItem label="Invite Team" className="sm:px-2" href="/team" />
			)}
			<li className="hidden items-stretch sm:flex">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="link"
							className="text-foreground hover:text-primary flex items-center space-x-1 px-3 py-2"
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
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>
							{sessionData.user.email || 'Account'}
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-border" />
						<ul className="flex flex-col">
							{canCreateContent && (
								<NavLinkItem
									variant="menu"
									href="/admin/coupons"
									label="Admin"
								/>
							)}
							{canViewInvoice && (
								<NavLinkItem variant="menu" href="/invoices" label="Invoices" />
							)}
							<NavLinkItem variant="menu" href="/profile" label="Profile" />
							<hr className="my-1" />
							<NavLinkItem
								variant="menu"
								href="#"
								label="Sign out"
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
