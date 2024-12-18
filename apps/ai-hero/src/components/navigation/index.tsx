'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { createAppAbility } from '@/ability'
import { useSaleToastNotifier } from '@/hooks/use-sale-toast-notifier'
import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import { Menu, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { useLiveEventToastNotifier } from '../app/use-live-event-toast-notifier'
import { useNavLinks } from '../app/use-nav-links'
import { LogoMark } from '../logo'
import { NavLinkItem } from './nav-link-item'
import { User } from './user'

const Navigation = () => {
	const links = useNavLinks()
	const pathname = usePathname()
	const isRoot = pathname === '/'
	const isEditRoute = pathname.includes('/edit')
	const params = useParams()
	const router = useRouter()
	const { setIsFeedbackDialogOpen } = useFeedback()

	const isLessonRoute = params.lesson && params.module
	const isFullWidth = Boolean(isEditRoute || isLessonRoute)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

	// useLiveEventToastNotifier()
	useSaleToastNotifier()

	React.useEffect(() => {
		setIsMobileMenuOpen(false)
	}, [pathname])

	const { data: abilityRules, status: abilityStatus } =
		api.ability.getCurrentAbilityRules.useQuery()

	const { data: sessionData, status: sessionStatus } = useSession()

	return (
		<header
			className={cn(
				'bg-background relative z-50 flex h-[var(--nav-height)] w-full items-stretch justify-between border-b px-0 print:hidden',
				{
					'sticky top-0': !params.lesson,
				},
			)}
		>
			<div
				className={cn(
					'flex w-full items-stretch justify-between px-3 sm:px-5',
					{
						container: !isEditRoute,
					},
				)}
			>
				<div className="flex items-stretch">
					<span
						onContextMenu={(e) => {
							e.preventDefault()
							router.push('/brand')
						}}
					>
						<Link
							tabIndex={isRoot ? -1 : 0}
							href="/"
							className="font-heading flex h-[var(--nav-height)] w-full items-center justify-center gap-2 pr-4 text-lg font-semibold leading-none transition"
						>
							<LogoMark className="w-8" />
							<span className="text-foreground text-xl font-bold !leading-none">
								AI Hero
							</span>
						</Link>
					</span>
					<hr
						aria-hidden="true"
						className="bg-muted-foreground/50 mx-2 my-auto hidden h-2 w-px sm:flex"
					/>
					{links.length > 0 && (
						<nav
							className="hidden items-stretch sm:flex"
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="flex items-stretch">
								{links.map((link) => {
									return (
										<NavLinkItem
											className=""
											key={link.href || link.label}
											{...link}
										/>
									)
								})}
							</ul>
						</nav>
					)}
				</div>
				<div className="flex items-stretch">
					{/* {!ability.can('read', 'Invoice') && abilityStatus !== 'pending' && (
					<div className="flex items-center pr-5">
						<Button asChild size="sm" className="h-8">
							<Link href="/#buy">Get Access</Link>
						</Button>
					</div>
				)} */}
					{sessionStatus === 'authenticated' && (
						<div className="hidden items-stretch sm:flex">
							<NavLinkItem
								label="Feedback"
								onClick={() => {
									setIsFeedbackDialogOpen(true)
								}}
							/>
						</div>
					)}
					<div className="hidden items-stretch sm:flex">
						<User />
					</div>
				</div>
				<div className="flex items-stretch sm:hidden">
					<MobileNav
						isMobileMenuOpen={isMobileMenuOpen}
						setIsMobileMenuOpen={setIsMobileMenuOpen}
					/>
				</div>
			</div>
		</header>
	)
}

export default Navigation

const MobileNav = ({
	isMobileMenuOpen,
	setIsMobileMenuOpen,
}: {
	isMobileMenuOpen: boolean
	setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
	const links = useNavLinks()
	const { data: sessionData, status: sessionStatus } = useSession()
	const { setIsFeedbackDialogOpen } = useFeedback()

	return (
		<div className="flex items-stretch">
			<Button
				variant="ghost"
				className="flex h-full items-center justify-center px-5"
				type="button"
				onClick={() => {
					setIsMobileMenuOpen(!isMobileMenuOpen)
				}}
			>
				{!isMobileMenuOpen ? (
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<line y1="4.5" x2="16" y2="4.5" stroke="currentColor" />
						<line y1="11.5" x2="16" y2="11.5" stroke="currentColor" />
					</svg>
				) : (
					<X className="h-5 w-5" />
				)}
			</Button>
			{isMobileMenuOpen && (
				<nav className="bg-background absolute left-0 top-[var(--nav-height)] z-10 w-full border-b px-2 py-3">
					{links.length > 0 &&
						links.map((link) => {
							return (
								<NavLinkItem
									className="flex w-full rounded px-2 py-2 text-base"
									key={link.href || link.label}
									{...link}
								/>
							)
						})}
					{sessionStatus === 'authenticated' && (
						<NavLinkItem
							className="flex w-full rounded px-2 py-2 text-base"
							label="Send Feedback"
							onClick={() => {
								setIsFeedbackDialogOpen(true)
							}}
						/>
					)}
					<User
						loginClassName="px-2 rounded py-2 text-base flex w-full"
						className="flex w-full rounded px-2 py-2 text-base"
					/>
				</nav>
			)}
		</div>
	)
}
