'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import {
	ChevronDownIcon,
	FileText,
	Lightbulb,
	ListChecks,
	Users,
} from 'lucide-react'
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
 * Desktop user menu client component with dropdown
 */
export const UserMenuClient = () => {
	const { data: sessionData, status: sessionStatus, update } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules || [])
	const router = useRouter()

	const canManageAll = ability.can('manage', 'all')

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
		return (
			<NavLinkItem
				className="rounded-md border"
				label="Sign in"
				href="/login"
			/>
		)
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

	// Check if we're impersonating
	const isImpersonating = Boolean(sessionData.user.impersonatingFromUserId)

	return (
		<>
			{/* {canViewTeam && <NavLinkItem label="Invite Team" href="/team" />} */}
			<li className="hidden items-stretch sm:flex">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="link"
							className={cn(
								'text-foreground hover:text-primary flex items-center space-x-1 px-3 py-2',
								isImpersonating &&
									'rounded-md border border-orange-200 bg-orange-50',
							)}
						>
							{isImpersonating && (
								<span className="mr-1 text-orange-600">🎭</span>
							)}
							{userAvatar}
							<div className="flex flex-col pl-0.5">
								<span className="text-foreground-muted inline-flex items-center gap-0.5 text-sm leading-tight">
									<span className="truncate sm:max-w-[8rem] lg:max-w-[11rem] xl:max-w-none">
										{sessionData.user.name?.split(' ')[0] || 'Account'}
									</span>
									{isImpersonating && (
										<span className="text-xs text-orange-600">
											(Impersonating)
										</span>
									)}
									<ChevronDownIcon className="w-2" />
								</span>
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>
							{isImpersonating ? (
								<div className="flex flex-col">
									<span className="font-medium text-orange-600">
										🎭 Impersonating
									</span>
									<span className="text-sm">{sessionData.user.email}</span>
									<span className="text-muted-foreground text-xs">
										Role: {sessionData.user.role}
									</span>
								</div>
							) : (
								sessionData.user.email || 'Account'
							)}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<ul className="flex flex-col">
							{canManageAll && (
								<>
									<NavLinkItem
										variant="menu"
										href="/admin/pages"
										label="Admin Pages"
										icon={<FileText className="mr-2 h-4 w-4" />}
									/>
									<NavLinkItem
										variant="menu"
										href="/admin/posts"
										label="Admin Posts"
										icon={<ListChecks className="mr-2 h-4 w-4" />}
									/>
									<NavLinkItem
										variant="menu"
										href="/admin/tips"
										label="Admin Tips"
										icon={<Lightbulb className="mr-2 h-4 w-4" />}
									/>
									<NavLinkItem
										variant="menu"
										href="/admin/contributors"
										label="Admin Contributors"
										icon={<Users className="mr-2 h-4 w-4" />}
									/>
								</>
							)}
							{/* {canViewInvoice && (
								<NavLinkItem variant="menu" href="/invoices" label="Invoices" />
							)} */}
							{/* <NavLinkItem variant="menu" href="/profile" label="Profile" /> */}
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
