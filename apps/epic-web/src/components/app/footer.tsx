'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavigationLinks } from '@/components/app/navigation/links'
import { cn } from '@/utils/cn'

// import { SearchIcon } from '@heroicons/react/outline'
// import { useSearchBar } from 'search-bar/use-search-bar'

const Footer = () => {
	const primaryNavLinks = useNavigationLinks()
	const footerNavLinks = [
		...primaryNavLinks,
		{
			label: 'Talks',
			href: '/talks',
			icon: () => {},
		},
		{
			label: 'Newsletter',
			href: '/newsletter',
			icon: () => {},
		},
		{
			label: 'Conf 2024',
			href: '/conf',
			icon: () => {},
		},
	]

	const contactLinks = [
		{
			label: 'Contact Us',
			href: '/contact',
		},
		{
			label: 'Email Support',
			href: `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`,
		},
	]

	const aboutLinks = [
		{
			label: 'FAQ',
			href: '/faq',
		},
		{
			label: 'Credits',
			href: '/credits',
		},
	]
	const pathname = usePathname()

	return (
		<footer className="shadow-soft-2xl relative w-full bg-white before:absolute before:left-0 before:top-0 before:h-px before:w-full before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent before:content-[''] dark:bg-black/50 dark:before:via-gray-800/75 print:hidden">
			<div className="relative mx-auto flex w-full max-w-screen-lg flex-col items-start justify-between gap-16 px-5 pb-48 pt-14 sm:flex-row sm:px-10 sm:pt-16 lg:px-5">
				<div className="relative mx-auto flex w-full flex-col items-center gap-8 text-center sm:items-start sm:gap-16 sm:text-left md:flex-row">
					<div>
						<strong className="font-mono text-xs uppercase tracking-wider opacity-60">
							Learn
						</strong>
						<ul className="pt-3 text-sm font-medium">
							{footerNavLinks.map(({ label, href }) => (
								<li key={href}>
									<Link
										className={cn(
											'inline-block py-1 opacity-80 transition hover:opacity-100',
											{
												'underline [&_span]:underline': pathname.includes(href),
											},
										)}
										href={href}
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div>
						<strong className="font-mono text-xs uppercase tracking-wider opacity-60">
							Contact
						</strong>
						<ul className="pt-3 text-sm font-medium">
							{contactLinks.map(({ label, href }) => (
								<li key={href}>
									<Link
										className="inline-block py-1 opacity-80 transition hover:opacity-100"
										href={href}
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div>
						<strong className="font-mono text-xs uppercase tracking-wider opacity-60">
							About
						</strong>
						<ul className="pt-3 text-sm font-medium">
							{aboutLinks.map(({ label, href }) => (
								<li key={href}>
									<Link
										className={cn(
											'inline-block py-1 opacity-80 transition hover:opacity-100',
											{
												'underline [&_span]:underline': pathname.includes(href),
											},
										)}
										href={href}
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>
				<div className="flex h-full w-full flex-col items-center gap-10 sm:items-end">
					<button
						className="group relative flex w-full max-w-[200px] flex-shrink-0 items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-medium shadow-inner transition dark:border-white/5 dark:bg-gray-800/50 hover:dark:bg-gray-900"
						type="button"
						// TODO: implement search functionality
						// onClick={() => {
						//   setSearchBarOpen(true)
						// }}
					>
						<div className="flex items-center gap-1.5">
							{/* <SearchIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" /> */}
							<span>Search</span>
						</div>
						<div className="flex items-center justify-center gap-0.5 text-xs uppercase transition group-hover:text-blue-500 dark:group-hover:text-blue-300">
							<kbd className="tracking-[0.25em]">⌘k</kbd>
						</div>
					</button>
				</div>
				<Link href="/" className="absolute bottom-5 right-8">
					<svg
						className="h-10 w-10 opacity-30 saturate-0 transition duration-300 ease-in-out hover:opacity-100 hover:saturate-100 sm:h-12 sm:w-12"
						viewBox="0 0 70 70"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M36.2769 33.7384C35.0376 34.4235 33.6137 35.1551 32.0196 35.888C25.6867 38.8 16.6372 41.7482 5.7924 41.8693L4.54328 41.8832L4.31667 40.6548C3.98144 38.8375 3.78557 36.9574 3.78557 35.0169C3.78557 17.8042 17.7873 3.80245 35 3.80245C39.7497 3.80245 44.258 4.86959 48.2947 6.77729L52.441 4.66358C47.3041 1.69794 41.3484 0 35 0C15.712 0 0 15.712 0 35C0 42.6997 2.50383 49.8295 6.73946 55.6175C13.9922 54.3823 18.5423 51.4766 18.5423 51.4766C18.5423 51.4766 15.637 56.0207 14.4018 63.2746C20.1863 67.5017 27.3088 70 35 70C54.288 70 70 54.288 70 35C70 28.6625 68.3067 22.7134 65.3476 17.5795L63.2374 21.7175C65.1465 25.7553 66.2144 30.2653 66.2144 35.0169C66.2144 52.2296 52.2127 66.2313 35 66.2313C33.0583 66.2313 31.1957 66.0352 29.3646 65.7007L28.1336 65.4758L28.1476 64.2245C28.2686 53.3714 31.2168 44.3218 34.1289 37.9908C34.8613 36.3985 35.5922 34.9763 36.2769 33.7384Z"
							fill="url(#paint0_linear_215_1284)"
						/>
						<path
							d="M53.2352 27.1553L45.2049 24.8112L42.8604 16.7642L69.5 0.5L53.2352 27.1553Z"
							fill="currentColor"
						/>
						<defs>
							<linearGradient
								id="paint0_linear_215_1284"
								x1="49.4956"
								y1="20.5044"
								x2="20.5854"
								y2="49.4308"
								gradientUnits="userSpaceOnUse"
							>
								<stop stopColor="#4F75FF" />
								<stop offset="1" stopColor="#30AFFF" />
							</linearGradient>
						</defs>
					</svg>
				</Link>
				<small className="absolute bottom-5 left-5 flex items-center gap-5">
					<span className="opacity-75">© EpicWeb.dev</span>
					<Link
						className="opacity-75 transition hover:opacity-100"
						href="/privacy"
					>
						Terms & Conditions
					</Link>
				</small>
			</div>
		</footer>
	)
}

export default Footer
