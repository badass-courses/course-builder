import type { Metadata } from 'next'
import Image from 'next/image'
import LayoutClient from '@/components/layout-client'
import team, { type TeamMember } from '@/content/team'

export const metadata: Metadata = {
	title: 'Credits | EpicAI Pro',
	description: 'Meet the humans behind EpicAI Pro',
	openGraph: {
		title: 'Credits | EpicAI Pro',
		description: 'Meet the humans behind EpicAI Pro',
	},
}

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
		<header className="flex w-full flex-col items-center px-3 py-16 text-center sm:px-10 sm:py-24">
			<h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
				Humans Behind EpicAI Pro
			</h1>
			<p className="text-muted-foreground mt-6 max-w-xl text-balance leading-relaxed">
				EpicAI Pro is a collaboration between Kent C. Dodds and the team behind{' '}
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
				{member.link && <SocialLink link={member.link} className="mt-5" />}
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
				{member.link && (
					<SocialLink
						link={member.link}
						className="mt-5 justify-center md:justify-start"
					/>
				)}
			</div>
		</article>
	)
}

function SocialLink({
	link,
	className = '',
}: {
	link: NonNullable<TeamMember['link']>
	className?: string
}) {
	const getHref = () => {
		if (link.label === 'X') {
			const handle = link.url.replace('https://x.com/', '')
			return `https://x.com/${handle}`
		}
		if (link.label === 'Bluesky') {
			return link.url
		}
		return link.url
	}

	return (
		<div className={`flex items-center gap-3 ${className}`}>
			<a
				href={getHref()}
				target="_blank"
				rel="noopener noreferrer"
				className="border-border hover:bg-muted flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
				aria-label={`${link.label} profile`}
			>
				{link.label === 'X' && <XIcon className="h-3 w-3" />}
				{link.label === 'Bluesky' && <BlueskyIcon className="h-4 w-4" />}
				{link.label === 'Website' && <WebsiteIcon className="h-4 w-4" />}
			</a>
			{link.label === 'Website' && (
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary font-mono text-xs hover:underline"
				>
					{extractDomain(link.url)}
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

function BlueskyIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 64 57"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill="currentColor"
				d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
			/>
		</svg>
	)
}

function WebsiteIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
			<polyline points="9 22 9 12 15 12 15 22" />
		</svg>
	)
}
