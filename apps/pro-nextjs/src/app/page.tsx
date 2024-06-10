import * as React from 'react'
import Image from 'next/image'
import LandingCopy from '@/components/landing-copy'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'

export const metadata = {
	title: {
		template: '%s | ProNext.js',
		default: `The No-BS Solution for Enterprise-Ready Next.js Applications`,
	},
}

const Home = () => {
	return (
		<div className="from-primary/5 to-background bg-gradient-to-b">
			<header className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center justify-center py-[15vh]">
				<h1 className="leading-0 font-heading w-full text-balance text-center text-5xl font-bold sm:text-7xl lg:text-8xl">
					The No-BS Solution for Enterprise-Ready Next.js Applications
				</h1>
				<h2 className="text-primary font-heading mt-5 inline-flex text-base font-medium sm:pt-5 sm:text-xl lg:text-2xl">
					Professional Next.js Training
				</h2>
				<div className="mt-8 flex items-center gap-2">
					<Image
						src={require('../../public/jack-herrington.jpg')}
						alt={config.author}
						priority
						className="w-12 rounded-full lg:w-auto"
						width={64}
						height={64}
					/>
					<div className="flex flex-col">
						<span className="text-base">{config.author}</span>
						<span className="text-sm opacity-60">Author & Instructor</span>
					</div>
				</div>
			</header>
			<main className="mx-auto w-full pt-5 sm:pt-24">
				<article className="prose sm:prose-lg mx-auto w-full max-w-[45rem] px-6 sm:px-3">
					<LandingCopy />
				</article>
				<PrimaryNewsletterCta className="my-16" />
				<section className="relative mx-auto mt-16 flex w-full max-w-screen-lg flex-col items-center gap-10 sm:mt-32 sm:flex-row sm:gap-20">
					<div className="relative">
						<Image
							src={require('../../public/jack-herrington.jpg')}
							alt={config.author}
							width={478}
							height={582}
							quality={100}
							className="rounded"
						/>
					</div>
					<div className="max-w-lg px-6 pb-32 sm:px-0 sm:pb-5">
						<h3 className="font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
							Meet Your Instructor
						</h3>
						<p className="pt-5 text-lg leading-relaxed sm:pt-8">
							Jack Herrington is a Full Stack Principal Engineer who
							orchestrated the rollout of React/NextJS at Walmart Labs and Nike.
							He is also the "Blue Collar Coder" on YouTube where he posts
							weekly videos on advanced use of React and NextJS as well as other
							frontend technologies trends. His YouTube channel hosts an entire
							free courses on React and TypeScript. He has written seven books
							including most recently No-BS TypeScript which is a companion book
							to the YouTube course.
						</p>
					</div>
				</section>
			</main>
			<div aria-hidden="true" className="py-10" />
		</div>
	)
}

export default Home
