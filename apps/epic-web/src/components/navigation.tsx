import Link from 'next/link'

export default function Navigation() {
	return (
		<header className="bg-background flex h-14 items-center border-b px-4">
			<div className="flex w-full items-center justify-between">
				<Link href="/" className="text-lg font-bold">
					Epic Web Builder
				</Link>
				<div className="flex gap-4">
					<Link href="/posts" className="hover:underline">
						Posts
					</Link>
					<Link href="/login" className="hover:underline">
						Log in
					</Link>
				</div>
			</div>
		</header>
	)
}
