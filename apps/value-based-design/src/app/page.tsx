import * as React from 'react'
import { type Metadata } from 'next'
import Image from 'next/image'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'

import LandingCopy from './_components/landing-copy'

export const metadata: Metadata = {
	title: 'Value-Based Design',
	description:
		'Drive business success with impactful design decisions. New self-paced workshop by nickd.',
}

export default async function Home() {
	return (
		<div className="flex flex-col pt-5">
			<section aria-label="About Value-Based Design Workshop">
				<article className="prose sm:prose prose-sm mx-auto w-full max-w-2xl px-6 pb-16 sm:pb-24">
					<LandingCopy />
					<PrimaryNewsletterCta withTitle={false} />
				</article>
			</section>
			<section
				aria-label="Your Instructor"
				className="text-background bg-black py-10 sm:py-24"
			>
				<div className="mx-auto flex w-full max-w-4xl flex-col-reverse items-center justify-between gap-10 px-6 sm:gap-24 lg:flex-row">
					<div>
						<h2 className="flex flex-col items-center gap-3 sm:items-start">
							<span className="font-heading text-primary text-base uppercase tracking-widest sm:text-lg">
								Your Instructor
							</span>{' '}
							<span className="font-heading text-4xl font-semibold sm:text-5xl">
								Nick Disabato
							</span>
						</h2>
						<div className="pt-10 text-center text-lg leading-relaxed opacity-80 sm:text-left sm:text-xl">
							<p className="mb-5">
								I&#8217;m{' '}
								<a
									className="underline"
									href="https://nickd.org/"
									target="_blank"
									rel="noreferrer"
								>
									Nick Disabato
								</a>
								, a designer & writer from the city of Chicago with 18 years of
								experience in the industry. I run{' '}
								<a
									className="underline"
									href="</a>"
									target="_blank"
									rel="noreferrer"
								>
									Draft
								</a>
								, a small consultancy for online stores that is known for a deep
								focus on revenue generation through qualitative, value-based
								research.
							</p>
							<p>
								Our{' '}
								<a
									className="underline"
									href="https://draft.nu/helped/"
									target="_blank"
									rel="noreferrer"
								>
									case studies
								</a>{' '}
								represent a net annual increase of $41M in revenue, and we’ve
								just had our best year ever. In 2023. The dissonance is felt
								over here.
							</p>
						</div>
					</div>
					<Image
						src={require('../../public/nickd.jpg')}
						alt="Nick Disabato"
						loading="eager"
						className="flex-shrink-0"
					/>
				</div>
			</section>
		</div>
	)
}
