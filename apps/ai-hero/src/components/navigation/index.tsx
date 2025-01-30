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

import { Button, Sheet, SheetContent } from '@coursebuilder/ui'
import { useFeedback } from '@coursebuilder/ui/feedback-widget/feedback-context'

import { useLiveEventToastNotifier } from '../app/use-live-event-toast-notifier'
import { useNavLinks } from '../app/use-nav-links'
import { LogoMark } from '../logo'
import { NavLinkItem } from './nav-link-item'
import { ThemeToggle } from './theme-toggle'
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
				className={cn('flex w-full items-stretch justify-between', {
					// container: !isEditRoute,
				})}
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
							className="font-heading hover:bg-muted flex h-[var(--nav-height)] w-full items-center justify-center gap-2 px-5 text-lg font-semibold leading-none transition"
						>
							<LogoMark className="w-7" />
							<span className="text-foreground text-xl font-semibold !leading-none">
								<span className="font-mono">AI</span>hero
							</span>
						</Link>
					</span>
					<hr
						aria-hidden="true"
						className="bg-border my-auto flex h-full w-px"
					/>
					{links.length > 0 && (
						<nav
							className={cn('flex items-stretch', {
								'hidden sm:flex': links.length > 3,
							})}
							aria-label={`Navigation header with ${links.length} links`}
						>
							<ul className="flex items-stretch">
								{links.map((link) => {
									return (
										<NavLinkItem
											className="text-base font-medium"
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
						<ThemeToggle className="hover:bg-muted border-l px-5" />
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
				className="flex h-full items-center justify-center border-l px-5"
				type="button"
				onClick={() => {
					setIsMobileMenuOpen(!isMobileMenuOpen)
				}}
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
					className="bg-card px-2 py-10 [&>button>svg]:h-7 [&>button>svg]:w-7 [&>button]:flex [&>button]:h-12 [&>button]:w-12 [&>button]:items-center [&>button]:justify-center"
				>
					<nav className="flex h-full flex-col items-start justify-between gap-2">
						<div className="flex flex-col gap-2">
							{links.length > 0 &&
								links.map((link) => {
									return (
										<NavLinkItem
											className="text-xl"
											key={link.href || link.label}
											{...link}
										/>
									)
								})}
							{sessionStatus === 'authenticated' && (
								<NavLinkItem
									className="text-xl"
									label="Send Feedback"
									onClick={() => {
										setIsFeedbackDialogOpen(true)
									}}
								/>
							)}
							<User
								loginClassName="text-xl"
								className="border-l-0 py-5 [&_span]:text-xl"
							/>
						</div>
						<div className="flex items-center justify-center">
							<ThemeToggle className="[&_svg]:h-5 [&_svg]:w-5" />
						</div>
					</nav>
				</SheetContent>
			</Sheet>
			{/* {isMobileMenuOpen && (
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
			)} */}
		</div>
	)
}
