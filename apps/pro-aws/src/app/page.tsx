import * as React from 'react'
import Image from 'next/image'
import { Layout } from '@/components/app/layout'
import { PrimaryNewsletterCta } from '@/components/primary-newsletter-cta'
import ReactMarkdown from 'react-markdown'
import Balancer from 'react-wrap-balancer'

export const metadata = {
	title: {
		template: '%s | Pro AWS',
		default: `Navigate the AWS Maze with Confidence`,
	},
}

const Home = async () => {
	return (
		<Layout>
			<header className="relative mx-auto flex aspect-square w-full max-w-screen-xl flex-col items-center justify-center border-x border-b py-24 sm:aspect-[1280/800]">
				<h1 className="leading-0 font-heading w-full text-center text-5xl font-bold text-white sm:text-7xl lg:text-8xl">
					<Balancer>Navigate the AWS Maze with Confidence</Balancer>
				</h1>
				<h2 className="text-primary font-heading pt-2 text-base font-medium tracking-widest sm:pt-5 sm:text-xl lg:text-2xl">
					Professional AWS Training
				</h2>
				<div className="bottom-[20%] right-[15%] mt-8 flex items-center gap-2 lg:absolute lg:mt-0">
					<Image
						src={`/instructor.png`}
						alt="Adam Elmore"
						priority
						className="w-12 rounded-sm lg:w-auto"
						width={64}
						height={64}
					/>
					<div className="flex flex-col">
						<span className="text-base">Adam Elmore</span>
						<span className="text-sm opacity-60">Author & Instructor</span>
					</div>
				</div>
				<Image
					priority
					className="-z-10 object-cover sm:object-contain"
					src={`/assets/hero@2x.jpg`}
					fill
					alt=""
					aria-hidden="true"
				/>
			</header>
			<main className="mx-auto w-full max-w-screen-xl border-x border-b pt-5 sm:pt-24">
				<article className="prose sm:prose-lg mx-auto w-full max-w-[45rem] px-6 sm:px-3">
					<ReactMarkdown className="prose dark:prose-invert">
						{`You're a skilled web developer, but you're stuck. Again. You know you need to leverage AWS to take your product where it needs to go, but you're lost in The Console, staring blankly. You've seen others build on the cloud to great success. But, how? 200+ services?! Where do you even begin?

You could go back to the comfort of a simplified platform, but you're tired of feeling limited. Tired of being boxed—err, "triangled"—in. You've been painting in black and white, and it's time to expand your palette.

You can build anything you can imagine on AWS. You're more than capable. You just need a guide. You need an opinionated, pragmatic view of a vast platform that exists to serve an infinite number of use cases. AWS provides all of the fundamental elements needed to craft brilliant web experiences. But, how you mix them is crucial.

That's where Pro AWS comes in. This isn't a typical AWS course. You won't study arcane architectural diagrams or listen to academic lectures on best practices. Every lesson is rooted in practicality and born out of real-world experience. You'll learn AWS through the lens of modern web development, because today you don't have to sacrifice developer experience to build on AWS.`}
					</ReactMarkdown>
				</article>
				<PrimaryNewsletterCta className="px-6 pt-8 sm:px-0 sm:pt-20" />
				<section className="relative mt-16 flex flex-col items-center gap-10  border-t sm:mt-32 sm:flex-row sm:gap-20">
					<div className="relative">
						<Image
							src={`/assets/adam-elmore@2x.png`}
							alt="Adam Elmore"
							width={478}
							height={582}
							quality={100}
						/>
						<div
							aria-hidden="true"
							className="bg-background absolute right-3 top-3 flex h-20 w-20 flex-col items-start justify-between border px-2 pb-2 sm:right-[-2rem] sm:top-[-2rem]"
						>
							<span className="text-border">—</span>
							<span className="text-3xl font-medium">Hi!</span>
						</div>
					</div>
					<div className="max-w-lg px-6 pb-32 sm:px-0 sm:pb-5">
						<h3 className="font-heading text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
							I&apos;m Adam.
						</h3>
						<p className="pt-5 text-lg leading-relaxed sm:pt-8">
							I&apos;m an AWS Hero and startup founder that&apos;s built web
							applications used by millions of people across the world every
							day. I&apos;ve spent the last decade building on AWS, and when I
							started I was as lost as you are today. I created Pro AWS to give
							everyone a path through the maze to unleash our collective
							creativity.
						</p>
					</div>
					<Image
						className="absolute bottom-[-66px] left-[calc(50%-66px)]"
						src={`/assets/proawsdev-badge@2x.png`}
						alt="Pro AWS Dev"
						width={133}
						height={133}
						quality={100}
					/>
				</section>
			</main>
			<div aria-hidden="true" className="py-10" />
		</Layout>
	)
}

export default Home
