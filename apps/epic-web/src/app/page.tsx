import Link from 'next/link'

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<h1 className="text-5xl font-bold tracking-tight sm:text-[5rem]">
					Epic Web Platform
				</h1>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
					<Link
						className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
						href="/posts"
					>
						<h3 className="text-2xl font-bold">Content →</h3>
						<div className="text-lg">
							Access Kent C. Dodds&apos; epic web content
						</div>
					</Link>
					<Link
						className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
						href="/login"
					>
						<h3 className="text-2xl font-bold">Login →</h3>
						<div className="text-lg">
							Sign in to access your account and manage content
						</div>
					</Link>
				</div>
			</div>
		</div>
	)
}
