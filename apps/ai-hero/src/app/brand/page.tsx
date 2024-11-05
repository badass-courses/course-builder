import type { Metadata } from 'next'
import { Logo, LogoMark } from '@/components/logo'

import { LogoAsset } from './_components/assets'

export const metadata: Metadata = {
	title: `${process.env.NEXT_PUBLIC_SITE_TITLE} Brand`,
	description: `${process.env.NEXT_PUBLIC_SITE_TITLE} Logo and Additional Branding Assets`,
}

export default async function BrandRoute() {
	return (
		<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col border-x">
			<div className="mx-auto flex w-full max-w-screen-lg items-center justify-center border-x border-b py-16">
				<h1 className="font-heading text-center text-5xl font-bold sm:text-6xl">
					Brand
				</h1>
			</div>
			<article className="divide-border mx-auto flex h-full w-full max-w-screen-lg flex-shrink-0 flex-col items-center divide-y border-x">
				<LogoAsset asset={<Logo />}>
					<Logo className="w-56" />
				</LogoAsset>
				<LogoAsset
					asset={<Logo onDark={false} />}
					className="bg-foreground [&_button]:invert"
				>
					<Logo className="text-background w-56" onDark={false} />
				</LogoAsset>
				<LogoAsset asset={<LogoMark />}>
					<LogoMark className="w-16" />
				</LogoAsset>
				<LogoAsset
					asset={<LogoMark onDark={false} />}
					className="bg-foreground [&_button]:invert"
				>
					<LogoMark className="text-background w-16" onDark={false} />
				</LogoAsset>
			</article>
		</main>
	)
}
