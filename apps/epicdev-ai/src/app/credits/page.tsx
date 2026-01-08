'use client'

import * as React from 'react'
import Image from 'next/image'
import LayoutClient from '@/components/layout-client'
import team, { type TeamMember } from '@/content/team'
import { cn } from '@/utils/cn'
import { useTheme } from 'next-themes'

export default function CreditsPage() {
	const [instructor, ...teamMembers] = team

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] grow flex-col pb-16">
				<Header />
				<div className="mx-auto flex w-full max-w-screen-md flex-col gap-16 px-3 pt-10 sm:gap-20 sm:px-5">
					{instructor && <InstructorCard member={instructor} />}
					<TeamList members={teamMembers} />
				</div>
			</main>
		</LayoutClient>
	)
}

function Header() {
	return (
		<header className="flex w-full flex-col items-center px-3 py-16 text-center sm:px-10 sm:pb-16 sm:pt-24">
			<h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
				Humans Behind Epic AI
			</h1>
			<p className="text-muted-foreground mt-6 max-w-xl text-balance leading-relaxed">
				Epic AI is a collaboration between Kent C. Dodds and the team behind{' '}
				<a
					href="https://badass.dev"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary font-medium underline underline-offset-2"
				>
					badass.dev
				</a>
				. Kent created, designed and recorded all the content, while the rest of
				the team provided planning, design, development, and delivery support.
			</p>
			<Badge className="mt-10" />
		</header>
	)
}

function InstructorCard({ member }: { member: TeamMember }) {
	return (
		<article className="flex flex-col items-center text-center">
			<div className="relative h-64 w-64 overflow-hidden rounded-xl sm:h-80 sm:w-80">
				<Image
					src={member.avatar}
					alt={member.name}
					fill
					className="object-cover"
					priority
				/>
			</div>
			<div className="pt-8">
				<h2 className="text-2xl font-bold sm:text-3xl">{member.name}</h2>
				<h3 className="text-muted-foreground pt-2 font-mono text-xs font-semibold uppercase tracking-wide">
					{member.title}
				</h3>
				<p className="text-muted-foreground mx-auto mt-4 max-w-lg text-balance leading-relaxed">
					{member.description}
				</p>
				<SocialLinks member={member} className="mt-5 justify-center" />
			</div>
		</article>
	)
}

function TeamList({ members }: { members: TeamMember[] }) {
	return (
		<div className="flex flex-col gap-16 sm:gap-20">
			{members.map((member, i) => (
				<TeamMemberCard key={member.name} member={member} index={i} />
			))}
		</div>
	)
}

function TeamMemberCard({
	member,
	index,
}: {
	member: TeamMember
	index: number
}) {
	const isEven = index % 2 === 0

	return (
		<article
			className={`flex flex-col items-center gap-6 sm:gap-10 ${
				isEven ? 'md:flex-row' : 'md:flex-row-reverse'
			}`}
		>
			<div className="relative h-52 w-52 flex-shrink-0 overflow-hidden rounded-lg sm:h-64 sm:w-64">
				<Image
					src={member.avatar}
					alt={member.name}
					fill
					className="object-cover"
				/>
			</div>
			<div className="w-full text-center md:text-left">
				<h2 className="text-2xl font-bold sm:text-3xl">{member.name}</h2>
				<h3 className="text-muted-foreground pt-2 font-mono text-xs font-semibold uppercase tracking-wide">
					{member.title}
				</h3>
				<p className="text-muted-foreground mt-4 max-w-lg text-balance leading-relaxed">
					{member.description}
				</p>
				<SocialLinks
					member={member}
					className="mt-5 justify-center md:justify-start"
				/>
			</div>
		</article>
	)
}

function SocialLinks({
	member,
	className = '',
}: {
	member: TeamMember
	className?: string
}) {
	const hasLinks = member.xHandle || member.website

	if (!hasLinks) return null

	return (
		<div className={`flex items-center gap-3 ${className}`}>
			{member.xHandle && (
				<a
					href={`https://x.com/${member.xHandle}`}
					target="_blank"
					rel="noopener noreferrer"
					className="border-border hover:bg-muted flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
					aria-label={`${member.name} on X`}
				>
					<XIcon className="h-3 w-3" />
				</a>
			)}
			{member.website && (
				<a
					href={member.website}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary font-mono text-xs hover:underline"
				>
					{extractDomain(member.website)}
				</a>
			)}
		</div>
	)
}

function extractDomain(url: string) {
	const match = url.match(/:\/\/(www[0-9]?\.)?([^/]+)(\/[^]*)?/)
	if (match) {
		return match[2] + (match[3] || '')
	}
	return url
}

function XIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9.52373 6.77569L15.4811 0H14.0699L8.89493 5.88203L4.7648 0H0L6.24693 8.89552L0 16H1.4112L6.87253 9.78704L11.2352 16H16M1.92053 1.04127H4.08853L14.0688 15.0099H11.9003"
				fill="currentColor"
			/>
		</svg>
	)
}

/**
 * Badge component that displays the Badass.dev badge with theme-aware styling.
 * Handles hydration mismatch by only rendering after mount.
 */
const Badge: React.FC<{ className?: string }> = ({ className }) => {
	const { resolvedTheme } = useTheme()
	const [mounted, setMounted] = React.useState(false)

	React.useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return (
		<a
			href="https://badass.dev"
			target="_blank"
			rel="noopener noreferrer"
			className={cn('mt-5 inline-block', className)}
		>
			<Image
				src={
					resolvedTheme === 'light'
						? '/credits/badass-badge-censored-light.svg'
						: '/credits/badass-badge-censored-dark.svg'
				}
				alt="Powered by Badass.dev"
				width={155}
				height={47}
			/>
		</a>
	)
}
