import * as React from 'react'
import { type Metadata } from 'next'
import Image from 'next/image'
import Footer from '@/components/app/footer'
import { Layout } from '@/components/layout'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import config from '@/config'
import { getPage } from '@/lib/pages-query'
import { MDXRemote } from 'next-mdx-remote/rsc'

import { CldImage } from './_components/cld-image'
import LandingCopy from './_components/landing-copy'

export const metadata: Metadata = {
	title: config.defaultTitle,
	description: config.description,
}

export default async function Home() {
	const page = await getPage('page-l9gb0')

	return (
		<Layout className="overflow-x-hidden border-x-0 bg-transparent">
			<section
				aria-label="Title"
				className="relative z-10 mx-auto flex w-full flex-grow flex-col items-center justify-center rounded-lg py-10 text-white sm:py-24 lg:py-24"
			>
				<h1 className="font-heading max-w-3xl text-balance text-center text-4xl font-black sm:text-5xl lg:text-6xl">
					<span className="font-rounded text-brand-yellow block pb-4 text-xl font-bold uppercase tracking-wide sm:text-2xl lg:text-3xl">
						Astro came to party
					</span>{' '}
					{page?.fields.title}
				</h1>
				<CldImage
					src={
						'http://res.cloudinary.com/badass-courses/image/upload/v1723449351/workshops/page-l9gb0/s4qtpqn2bogbo4hyppbq.png'
					}
					alt=""
					aria-hidden="true"
					width={800}
					height={800}
					className="pointer-events-none mt-24 scale-150 select-none sm:mt-0 sm:scale-100"
				/>
			</section>
			<main className="-mt-64 flex flex-col items-center sm:-mt-96">
				<div className="prose-ul:pl-4 prose-li:marker:text-brand-primary relative flex w-full max-w-4xl flex-col items-center rounded-full border-2 border-black bg-white px-5 pb-96 pt-40 sm:mx-auto sm:border-4 sm:px-24">
					<div className="font-rounded relative z-20 flex items-center gap-3 pb-16 text-2xl font-semibold leading-none">
						<Image
							className="rounded-full border-[3px] border-black"
							width={100}
							height={100}
							src={require('../../public/jason-lengstorf.png')}
							placeholder="blur"
							priority
							alt="Jason Lengstorf"
						/>
						<div>
							<span className="text-brand-red block pl-0.5 text-lg font-medium">
								Learn Astro with
							</span>
							<span>Jason Lengstorf</span>
						</div>
					</div>
					<article className="prose sm:prose-lg lg:prose-xl first-letter:font-heading prose-headings:pb-6 prose-headings:text-center prose-headings:font-rounded prose-headings:font-semibold prose-p:text-black prose-li:text-black mx-auto w-full max-w-2xl font-sans first-letter:float-left first-letter:pr-3 first-letter:pt-1.5 first-letter:text-5xl first-letter:font-bold sm:first-letter:pt-1 sm:first-letter:text-6xl lg:first-letter:pt-0 lg:first-letter:text-7xl">
						{page?.fields?.body ? (
							<MDXRemote
								components={{
									Image,
								}}
								options={{ blockJS: false }}
								source={page.fields.body}
							/>
						) : (
							<LandingCopy />
						)}
					</article>
					<div className="pointer-events-none absolute bottom-0 flex aspect-square w-full max-w-none select-none items-center justify-center overflow-hidden rounded-b-full">
						<Image
							className="absolute bottom-[-38px] max-w-none"
							src={require('../../public/assets/rainbow@2x.png')}
							width={480}
							// fill
							priority
							alt=""
							aria-hidden="true"
						/>
					</div>
					<Image
						className="pointer-events-none absolute bottom-[-140px] ml-28 select-none"
						src={require('../../public/assets/ghost-hanging@2x.png')}
						width={270}
						// height={442}
						priority
						alt=""
						aria-hidden="true"
					/>
				</div>
				<PrimaryNewsletterCta className="w-full px-5 pb-40 pt-56">
					<h2 className="font-heading mx-auto w-full max-w-3xl text-balance pb-10 text-center text-3xl font-black text-white sm:pb-20 sm:text-4xl lg:text-5xl">
						Get the latest Astro tutorials and tips delivered to your inbox.
					</h2>
				</PrimaryNewsletterCta>
			</main>
			<Footer />
		</Layout>
	)
}
