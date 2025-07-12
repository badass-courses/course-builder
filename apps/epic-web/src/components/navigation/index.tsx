'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, Newspaper, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Logo } from '../brand/logo'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

const Navigation = ({
	withContainer,
	highlightedResource,
}: {
	withContainer?: boolean
	highlightedResource?: { path: string; title: string }
}) => {
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()

	const isLessonRoute = params.lesson && params.module
	const isFullWidth = Boolean(isEditRoute || isLessonRoute)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	// const { data: abilityRules, status: abilityStatus } =
	// 	api.ability.getCurrentAbilityRules.useQuery()

	const { data: sessionData, status: sessionStatus } = useSession()
	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	return (
		<header
			className={cn(
				'h-(--nav-height) relative z-50 flex w-full items-center justify-between print:hidden',
				{
					'px-5': !withContainer,
				},
			)}
		>
			<div
				className={cn('relative flex w-full items-center justify-center', {
					// container: !isEditRoute,
				})}
			>
				<span
					className="flex items-center justify-center"
					// onContextMenu={(e) => {
					// 	e.preventDefault()
					// 	router.push('/brand')
					// }}
				>
					<Link
						prefetch
						tabIndex={isRoot ? -1 : 0}
						href="/"
						className="font-heading absolute left-0 flex items-center justify-center gap-2 pr-5 text-lg font-semibold leading-none transition"
					>
						<Logo />
					</Link>
				</span>

				<nav
					className="absolute right-0 flex items-center"
					aria-label={`User navigation`}
				>
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					<ul className="hidden items-center md:flex">
						<UserMenu />
						<ThemeToggle className="" />
					</ul>
				</nav>
				<MobileNavigation
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
					subscriber={subscriber}
				/>
			</div>
		</header>
	)
}

export default Navigation
