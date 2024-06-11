import * as React from 'react'
import { type Metadata } from 'next'
import Image from 'next/image'

import { Button, Input, Label } from '@coursebuilder/ui'

// import { coursebuilder } from '@/coursebuilder/course-builder-config'

export const metadata: Metadata = {
	title: 'Value-Based Design',
	description: '',
}

export default async function Home() {
	return (
		<div className="flex flex-col">
			<section className="flex flex-col px-16 pb-32 pt-64">
				<h1 className="font-heading text-center text-5xl font-semibold sm:text-6xl lg:text-7xl xl:text-8xl">
					Value-Based Design
				</h1>
			</section>
			<section
				aria-label="About Value-Based Design Workshop"
				className="from-background  bg-gradient-to-b to-gray-200 pb-32"
			>
				<article className="prose sm:prose-xl mx-auto w-full max-w-3xl px-6">
					<h2 className="font-heading text-center text-3xl font-semibold sm:text-4xl lg:text-5xl xl:text-6xl">
						Undervalued. Overlooked. Dispensable. Discarded.
					</h2>

					<p>
						These are just a few words that describe the pain that many
						designers are feeling right now.
					</p>

					<p>
						Tech is at an existential crossroads -{' '}
						<span className="italic">is it threatening or empowering?</span> –
						and widespread layoffs bring an added layer of uncertainty to the
						struggle against burnout.
					</p>

					<p>
						It’s easy to feel helpless. But looking at the industry from this
						perspective isn’t productive for your job in the short term, and it
						isn’t healthy for your career in the long term.
					</p>

					<p>
						Take a step back. Look at design from a different angle. There is a
						better way forward for our industry, and it starts with asking why
						people buy design in the first place.
					</p>

					<h2 className="font-heading text-center text-3xl font-semibold sm:text-4xl lg:text-5xl xl:text-6xl">
						Another World is Possible
					</h2>
					<p>
						Designers are good at researching why customers buy products, but
						the majority of us don’t perform the same research on our own jobs.
					</p>

					<ul>
						<li>Why do clients choose to work with us?</li>
						<li>Why do we get hired to practice design?</li>
						<li>What’s our own purpose?</li>
					</ul>

					<p>
						This research is essential because it helps us understand the value
						that we bring to the table. It helps us understand how we can be
						essential to our clients and our companies.
					</p>

					<p>
						Design isn’t bought because of trends like crypto, large-language
						models, or even because our portfolios have a specific aesthetic.
					</p>

					<p>
						People buy design because{' '}
						<span className="font-bold">
							there’s an expensive problem that needs to be solved
						</span>{' '}
						in a way that the designer’s specific expertise is uniquely suited
						to solve.
					</p>

					<p>
						Businesses want to increase profit, lower their costs, and reduce
						risk.
					</p>

					<p>
						They will invest in anything that can affect one of those variables.
						When you are a person who can help them do that, you become valuable
						to the business.
					</p>

					<h2 className="font-heading text-center text-3xl font-semibold sm:text-4xl lg:text-5xl xl:text-6xl">
						Become Essential
					</h2>

					<p>
						By connecting your design decisions to these business objectives,
						you've made it easy for others to see the impact of your work. You
						can't be overlooked when the design you produced increases profit at
						a lower cost to the business.
					</p>

					<p className="font-bold">This makes you essential.</p>

					<p>
						When you’re essential, you'll survive that next round of layoffs.
						You'll get promoted into a role with more power. You'll find a job
						that respects you. In short, you will finally pull up that
						ever-elusive seat at the table that we all keep hearing about.
					</p>

					<p>
						By rooting your design practice in the generation of value, which we
						call value-based design, you'll move the business in the right
						direction and be recognized for your efforts.
					</p>

					<h2 className="font-heading text-center text-3xl font-semibold sm:text-4xl lg:text-5xl xl:text-6xl">
						Design with Value in Mind
					</h2>

					<p>
						Design runs much deeper than selecting the right typography, color,
						and composition of elements on a page. It speaks to the value that
						people get from the service your business offers.
					</p>

					<p>
						Your design should increase that value through an iterative,
						holistic approach.
					</p>

					<p>
						Value-based design will level up your approach by incorporating
						elements of customer success, product, interaction design, and user
						research that are grounded in evidence.
					</p>

					<p>
						You'll be provided with a framework to research, measure, and
						experiment with solutions to the problems that your business has
						today.
					</p>

					<p>When you become a practitioner of value-based design, you’ll:</p>

					<ul>
						<li>
							Use your design sense to reliably deliver work that has an impact
						</li>
						<li>Understand how to ground design decisions in evidence</li>
						<li>
							Apply the soft skills you need to survive and thrive in any
							organization
						</li>
						<li>Accurately measure the impact of your decisions</li>
						<li>
							Advocate for design in a way that’s fundamentally impossible to
							ignore
						</li>
					</ul>
				</article>
			</section>
			<section
				aria-label="Sign Up"
				className="bg-primary flex flex-col items-center px-6 py-32"
			>
				<h2 className="font-heading text-balance text-center text-4xl font-semibold sm:text-5xl xl:text-6xl">
					Subscribe for Free Tips, Tutorials, and Special Discounts
				</h2>
				<p className="mt-8 max-w-2xl text-balance text-center text-base opacity-80 sm:text-lg">
					Become essential to your business and ship design that matters.
				</p>
				<div className="mt-16 flex w-full max-w-4xl flex-col items-center gap-2 lg:flex-row">
					<div className="w-full">
						<Label htmlFor="name" className="sr-only">
							First Name
						</Label>
						<Input
							placeholder="First name"
							id="name"
							className="h-14 w-full rounded-xl border-none px-5 text-lg lg:w-80"
						/>
					</div>
					<div className="w-full">
						<Label htmlFor="name" className="sr-only">
							E-Mail Address
						</Label>
						<Input
							placeholder="you@company.com"
							className="h-14 w-full rounded-xl border-none px-5 text-lg lg:w-80"
						/>
					</div>
					<Button className="bg-foreground text-background h-14 w-full rounded-xl px-10 text-lg font-semibold">
						Sign Up
					</Button>
				</div>
			</section>
			<section
				aria-label="Your Instructor"
				className="text-background bg-black py-32"
			>
				<div className="mx-auto flex w-full max-w-4xl flex-col-reverse items-center justify-between gap-24 px-6 lg:flex-row">
					<div>
						<h2 className="flex flex-col items-center gap-3 sm:items-start">
							<span className="font-heading text-primary text-base uppercase tracking-widest sm:text-lg">
								Your Instructor
							</span>{' '}
							<span className="font-heading text-4xl font-semibold sm:text-5xl">
								Nick Disabato
							</span>
						</h2>
						<div className="pt-10 text-center leading-relaxed opacity-80 sm:text-left sm:text-lg">
							<p className="">
								I’m{' '}
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
