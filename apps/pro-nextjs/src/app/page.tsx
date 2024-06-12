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
		<div className="">
			<header className="relative mx-auto flex w-full flex-col items-center justify-center py-[15vh]">
				<Image
					src={require('../../public/assets/bg.svg')}
					alt=""
					aria-hidden="true"
					fill
					className="object-cover object-bottom"
				/>
				<div className="relative z-10 flex flex-col items-center justify-center px-5">
					<div className="bg-background mb-5 flex items-center justify-center gap-2 rounded-full border p-1 pr-2.5 text-sm shadow">
						<Image
							src={require('../../public/jack-herrington.jpg')}
							alt={config.author}
							priority
							className="rounded-full"
							width={32}
							quality={100}
							height={32}
						/>
						<span>{config.author}</span>
					</div>
					<h1 className="leading-0 font-heading fluid-3xl w-full max-w-4xl text-center font-bold">
						The No-BS Solution for Enterprise-Ready Next.js Applications
					</h1>
					<h2 className="font-heading fluid-base text-muted-foreground mt-5 inline-flex font-normal">
						Professional Next.js Training
					</h2>
				</div>
			</header>
			<main className="mx-auto w-full pt-5 sm:pt-24">
				<article className="prose sm:prose-lg mx-auto w-full max-w-[45rem] px-6 sm:px-3">
					<LandingCopy />
				</article>
				<PrimaryNewsletterCta className="my-16" />
				<section className="relative mx-auto mt-5 flex w-full max-w-screen-lg flex-col items-center gap-10 px-5 sm:mt-24 sm:flex-row sm:gap-16">
					<div className="relative w-48 sm:w-auto">
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
							frontend technologies trends. His{' '}
							<a
								href="https://www.youtube.com/@jherr"
								target="_blank"
								rel="noreferrer noopener"
								className="text-primary"
							>
								YouTube channel
							</a>{' '}
							hosts an entire free courses on React and TypeScript. He has
							written seven books including most recently No-BS TypeScript which
							is a companion book to the YouTube course.
						</p>
					</div>
				</section>
			</main>
			<div aria-hidden="true" className="py-10" />
		</div>
	)
}

export default Home
