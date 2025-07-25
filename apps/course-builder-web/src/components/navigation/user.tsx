'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid'
import { cx } from 'class-variance-authority'
import { ChevronDownIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Gravatar,
} from '@coursebuilder/ui'

export const User: React.FC<{ className?: string }> = ({ className }) => {
	const pathname = usePathname()
	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: abilityRules } = api.ability.getCurrentAbilityRules.useQuery()
	const ability = createAppAbility(abilityRules)
	const isLoadingUserInfo = sessionStatus === 'loading'

	const canCreateContent = ability.can('create', 'Content')

	return (
		<>
			{isLoadingUserInfo || !sessionData?.user?.email ? null : (
				<DropdownMenu>
					<DropdownMenuTrigger
						className={cn('mr-3 flex items-center space-x-1', className)}
					>
						<Gravatar
							className="h-7 w-7 rounded-full"
							email={sessionData?.user?.email}
							default="mp"
						/>
						<div className="flex flex-col pl-0.5">
							<span className="inline-flex items-center gap-0.5 text-sm font-bold leading-tight">
								<span className="truncate sm:max-w-32 lg:max-w-44 xl:max-w-none">
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
							<ArrowLeftOnRectangleIcon className="h-4 w-4" />
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</>
	)
}
