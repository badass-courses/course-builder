'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline'
import { cx } from 'class-variance-authority'
import { ChevronDownIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Gravatar from 'react-gravatar'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Skeleton,
} from '@coursebuilder/ui'

import { NavLinkItem } from './nav-link-item'

export const User: React.FC<{
	className?: string
	loginClassName?: string
}> = ({ className, loginClassName }) => {
	const pathname = usePathname()
	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)
	const isLoadingUserInfo = sessionStatus === 'loading'

	const canCreateContent = ability.can('create', 'Content')

	return (
		<>
			{isLoadingUserInfo ? (
				<div className="flex items-stretch">
					<div className="flex h-full items-center justify-center px-5">
						<Skeleton className="bg-foreground/10 h-2 w-10 rounded" />
					</div>
				</div>
			) : (
				<>
					{!sessionData?.user?.email ? (
						<NavLinkItem
							className={loginClassName}
							label="Login"
							href="/login"
						/>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger
								className={cn('mr-3 flex items-center space-x-1', className)}
							>
								{sessionData?.user?.image ? (
									<Image
										src={sessionData?.user?.image}
										alt={sessionData?.user?.name || ''}
										width={28}
										height={28}
										className="rounded-full"
									/>
								) : (
									<Gravatar
										className="h-7 w-7 rounded-full"
										email={sessionData?.user?.email}
										default="mp"
									/>
								)}
								<div className="flex flex-col pl-0.5">
									<span className="inline-flex items-center gap-0.5 text-sm font-bold leading-tight">
										<span className="truncate sm:max-w-[8rem] lg:max-w-[11rem] xl:max-w-none">
											{sessionData?.user?.name?.split(' ')[0]}
										</span>{' '}
										<ChevronDownIcon className="w-2" />
									</span>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuLabel>
									{sessionData?.user?.email || 'Account'}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="flex items-center justify-between"
									asChild
								>
									<Link
										href="/profile"
										className={cx({
											underline: pathname.includes('/profile'),
										})}
									>
										Profile
									</Link>
								</DropdownMenuItem>
								{canCreateContent && (
									<>
										{' '}
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="flex items-center justify-between"
											asChild
										>
											<Link
												href="/admin"
												className={cx({
													underline: pathname.includes('/admin'),
												})}
											>
												Admin
											</Link>
										</DropdownMenuItem>
									</>
								)}
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => {
										signOut()
									}}
									className="flex items-center justify-between"
								>
									{' '}
									<span>Log out</span>
									<ArrowRightEndOnRectangleIcon className="h-4 w-4" />
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</>
			)}
		</>
	)
}
