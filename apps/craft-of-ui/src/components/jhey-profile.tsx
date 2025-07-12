import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function JheyProfile() {
	return (
		<section className="not-prose mx-auto w-full">
			<h2 className="text-fluid font-serif">Hey – I'm Jhey Tompkins 🤙</h2>
			<div className="clearfix">
				<Image
					className="float-none mb-4 mr-6 h-[180px] w-[180px] rounded-lg bg-gray-500 object-cover sm:float-left"
					src="/headshot.jpeg"
					alt="Jhey on stage at All Day Hey"
					width={180}
					height={180}
					priority
				/>
				<div
					className="[&_p]:text-md leading-[1.5]
				[&_h2]:mb-4 [&_h2]:mt-20 [&_h2]:font-serif [&_h2]:font-[600] [&_h2]:leading-none [&_h2]:[--font-level:1.8] [&_h2]:[--font-size-min:20]
				[&_p:not(:has(+ul))]:mb-8 [&_ul]:mb-8 [&_ul]:mt-2 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-y-2 [&_ul]:pl-6"
				>
					<p>
						I'm a design engineer who loves making the web feel magical whilst
						showing others how to do the same.
					</p>
					<p>
						Currently, I'm a{' '}
						<Link
							href="https://vercel.com/design"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Design Engineer at Vercel
						</Link>
						. Before that I worked in{' '}
						<Link
							href="https://developer.chrome.com/s/results?q=jhey"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							Developer Relations at Google
						</Link>{' '}
						as part of the{' '}
						<Link
							href="https://web.dev/s/results?q=jhey"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							CSS and UI
						</Link>{' '}
						team on Chrome. Along the way, I've built for brands like Nike,
						Uber, Nearform, and Monzo.
					</p>
					<p>
						Over the years I've shared thousands of demos with the community
						resulting in a{' '}
						<Link
							href="https://twitter.com/intent/follow?screen_name=jh3yy"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							following on X
						</Link>{' '}
						of over 120,000 people and 18,000 on{' '}
						<Link
							href="https://codepen.io/jh3y"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							CodePen
						</Link>{' '}
						(of which many have asked for this course). It's given me the
						opportunity to{' '}
						<Link
							href="https://youtu.be/loKm4JcT4U4"
							className="text-red-400 hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							speak at conferences
						</Link>{' '}
						all over the world about building user interfaces and it's opened
						doors to opportunities at companies like Google and Vercel.
					</p>
					<p>
						People now know me for turning complex challenges into simple,
						delightful experiences. For building things that make you say "wait,
						how did you do that?" and for doing it with the web platform and
						good craft.
					</p>
					<p>
						This course is my way of sharing everything I've learned across my
						career. From the fundamentals to the fun stuff. Not just how to
						build things that work, but how to build things that wow. Whether
						you're just getting started or you're the person the team turns to
						when things get tricky, I want to help you level up your skills and
						build with confidence.
					</p>
					<p>Let's go.</p>
				</div>
			</div>
			<div className="flex flex-col gap-y-2 pt-2">
				<div className="font-semibold">– Jhey, the Craft of UI</div>
				<svg
					aria-hidden="true"
					className="sig text-[canvasText]"
					viewBox="0 0 271 209"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Signature</title>
					<path
						d="M40.3725 26.8984C58.6558 41.1564 141.659 43.1867 128.248 5.48254C127.911 4.53766 127.085 2.2403 125.938 2.0095C124.714 1.76297 121.929 6.39448 121.627 6.82375C100.965 36.1863 95.2641 73.5992 74.5923 102.644C63.7045 117.942 14.7891 145.678 5.55986 113.481C-17.5939 32.705 78.7483 76.0672 105.741 67.4678C119.757 63.0021 125.297 50.6825 132.831 39.1622C135.218 35.5126 137.628 24.6153 140.043 28.2467C144.771 35.3581 119.642 69.8761 115.559 78.4692C110.959 88.1482 129.228 46.7461 136.796 54.3333C146.229 63.7897 128.236 82.7359 153.367 61.6804C157.634 58.1059 166.582 46.4029 161.033 46.8455C153.977 47.4085 141.565 67.0198 151.685 70.0327C161.531 72.9635 176.039 38.7196 174.012 48.7901C173.009 53.769 168.343 67.3695 175.978 68.9069C186.537 71.0328 191.574 35.8659 197.537 44.8359C240.356 109.24 81.7126 283.324 50.2184 167.261C25.2159 75.1229 240.563 89.2082 268.88 137.08"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={{ '--path-speed': 0.831875 } as React.CSSProperties}
					></path>
					<path
						className="ear"
						d="M187.183 101.246C182.107 82.5407 155.739 77.9455 151.5 99"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={
							{
								'--path-speed': 0.03187,
								'--path-delay': 0.831875,
							} as React.CSSProperties
						}
					></path>
					<path
						className="ear"
						d="M117.998 100.704C117.998 91.1516 103.912 87.3662 96.5585 89.3717C84.7816 92.5836 80.6315 99.053 80.6315 110.505"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={
							{
								'--path-speed': 0.035625,
								'--path-delay': 0.86375,
							} as React.CSSProperties
						}
					></path>
					<path
						className="eye"
						d="M170.025 108.347C168.627 105.551 162.781 110.631 165.494 114.577C168.207 118.523 173.936 114.091 171.643 109.965C171.035 108.871 168.547 107.832 167.355 108.428"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={
							{
								'--path-speed': 0.0175,
								'--path-delay': 0.899375,
							} as React.CSSProperties
						}
					></path>
					<path
						className="eye"
						d="M102.952 112.797C97.2672 112.797 96.7371 120.527 102.224 119.917C108.363 119.235 105.409 110.012 100.363 113.04"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={
							{
								'--path-speed': 0.01625,
								'--path-delay': 0.916875,
							} as React.CSSProperties
						}
					></path>
					<path
						className="nose"
						d="M144.745 123.82C146.652 122.562 141.479 121.621 140.561 121.402C136.485 120.429 124.736 118.793 124.42 125.721C123.695 141.628 160.767 131.457 140.492 121.735"
						stroke="currentColor"
						strokeWidth="4"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength="1"
						style={
							{
								'--path-speed': 0.04,
								'--path-delay': 0.933125,
							} as React.CSSProperties
						}
					></path>
				</svg>
			</div>
		</section>
	)
}
