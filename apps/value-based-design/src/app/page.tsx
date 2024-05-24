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
				{/* <h1 className="font-heading flex flex-col items-center gap-3 text-center">
					<span className="text-7xl">Value–Based</span>{' '}
					<span className="text-9xl font-bold uppercase tracking-[24px]">
						Design
					</span>
				</h1>
				<div aria-hidden="true" className="mt-10 flex items-center gap-2">
					<div className="bg-foreground h-px w-10" />
					<div className="mb-0.5 text-3xl leading-none">❖</div>
					<div className="bg-foreground h-px w-10" />
				</div> */}
			</section>
			<section
				aria-label="About Value-Based Design Workshop"
				className="from-background  bg-gradient-to-b to-gray-200 pb-32"
			>
				<article className="prose sm:prose-xl mx-auto w-full max-w-3xl px-6">
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sit
						amet sapien sapien. Suspendisse potenti. Fusce efficitur nisi nec
						magna dapibus, ut bibendum justo commodo. Sed varius risus sit amet
						libero facilisis, ut convallis magna volutpat. Morbi ut dictum
						metus. Integer efficitur, sapien ac facilisis sagittis, erat urna
						tincidunt lectus, at fermentum enim magna eget ligula. Integer sit
						amet est lectus. Vivamus faucibus lacus magna, nec varius magna
						hendrerit in. Phasellus cursus orci nec lectus congue, sed efficitur
						metus tincidunt.
					</p>
					<p>
						Mauris consectetur, justo et porttitor gravida, augue justo
						ultricies augue, nec finibus eros erat id lacus. Proin fringilla
						lacinia velit, vel scelerisque nunc varius id. Suspendisse potenti.
						Sed in justo felis. Cras id felis ut urna tincidunt tempus. Praesent
						nec hendrerit lectus. Integer vitae ante lectus. Cras malesuada
						lorem quis magna dignissim auctor.
					</p>
					<p>
						Ut facilisis lorem et justo laoreet, et aliquam orci pellentesque.
						Integer et tincidunt nunc, vitae tristique dui. Sed mollis ligula
						nec dictum elementum. Sed non metus purus. Duis et arcu a nulla
						tristique egestas a sed urna. Cras facilisis dui nec dolor
						tincidunt, at malesuada metus placerat. Aliquam erat volutpat. Sed a
						felis quam. Donec egestas dui non ipsum vestibulum rhoncus.
						Pellentesque in tempor ipsum. Integer interdum odio quis orci
						vehicula, sed lacinia mauris sagittis. Quisque lacinia massa in
						purus fermentum, in sodales arcu accumsan.
					</p>
					<p>
						Morbi vitae justo vel libero suscipit suscipit non sed felis.
						Suspendisse volutpat arcu ut nisi cursus, sit amet tincidunt ex
						gravida. Fusce aliquam odio a libero dignissim, non sollicitudin
						mauris ullamcorper. Integer id pharetra ligula. Etiam aliquam, purus
						a facilisis auctor, dolor ante posuere ligula, vitae fermentum nisl
						turpis sit amet dui. Ut id velit ut ex dictum tincidunt a ut erat.
						Sed vel augue lectus. Pellentesque habitant morbi tristique senectus
						et netus et malesuada fames ac turpis egestas. Nulla facilisi.
					</p>
				</article>
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
								Proin pulvinar pulvinar est ac laoreet. Nam mauris est,
								porttitor ut nisl sed, pulvinar bibendum diam. Fusce maximus
								ante finibus erat auctor, sit amet dignissim mi sollicitudin.
								Fusce eget nulla turpis. Nam turpis nunc, mollis sit amet
								pharetra eget, vehicula et nisl. Nulla elementum odio quis
								tellus porttitor, vel rhoncus libero molestie.
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
			<section
				aria-label="Sign Up"
				className="bg-primary flex flex-col items-center px-6 py-32"
			>
				<h2 className="font-heading text-balance text-center text-4xl font-semibold sm:text-5xl xl:text-6xl">
					Lorem Ipsum Dolor Sit Amet
				</h2>
				<p className="mt-8 max-w-2xl text-balance text-center text-base opacity-80 sm:text-lg">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sit
					amet sapien sapien. Suspendisse potenti. Fusce efficitur nisi nec
					magna dapibus, ut bibendum justo commodo.
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
		</div>
	)
}
