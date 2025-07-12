'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility, User } from '@/ability'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, Newspaper, X } from 'lucide-react'

import { Logo } from '../brand/logo'
import { MobileNavigation } from './mobile-navigation'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
import { UserMenuClient } from './user-menu-client'

const Navigation = ({
	withContainer,
	highlightedResource,
	user,
}: {
	withContainer?: boolean
	highlightedResource?: { path: string; title: string }
	user?: User | null
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

	const { data: subscriber, status } =
		api.ability.getCurrentSubscriberFromCookie.useQuery()

	return (
		<header
			className={cn(
				'relative z-50 flex h-[var(--nav-height)] w-full items-center justify-between print:hidden',
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
					<ul className="hidden items-center md:flex">
						<UserMenuClient user={user} />
						<ThemeToggle className="" />
					</ul>
				</nav>
				<MobileNavigation
					isMobileMenuOpen={isMobileMenuOpen}
					setIsMobileMenuOpen={setIsMobileMenuOpen}
					subscriber={subscriber}
					user={user}
				/>
			</div>
		</header>
	)
}

export default Navigation
