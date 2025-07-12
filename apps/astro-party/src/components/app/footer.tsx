import Link from 'next/link'

export default function Footer() {
	return (
		<footer className="max-w-(--breakpoint-lg) relative mx-auto flex w-full flex-col items-start justify-between gap-16 px-5 pb-48 pt-14 sm:flex-row sm:px-10 sm:pt-16 lg:px-5">
			<small className="absolute bottom-5 left-5 flex items-center gap-5 text-white">
				<span className="opacity-75">© astro.party</span>
				<Link
					className="opacity-75 transition hover:opacity-100"
					href="/privacy"
				>
					Terms & Conditions
				</Link>
			</small>
		</footer>
	)
}
