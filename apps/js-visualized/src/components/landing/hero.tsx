import * as React from 'react'
import Image from 'next/image'

const Hero = () => {
	return (
		<div className="not-prose relative 2xl:-mx-10">
			<Image
				src="/images/bg-landing-hero.png"
				alt="hero section"
				width={1360}
				height={760}
				priority
			/>
			<div className="absolute inset-0 z-10 flex items-center py-10 pl-28">
				<div className="max-w-[536px]">
					<h1 className="text-[2.5rem] font-normal leading-[1.3] tracking-tight">
						Deep Comprehensive Understanding of JavaScript{' '}
						<span className="bg-gradient-green-to-blue bg-clip-text font-black text-transparent">
							Visualized
						</span>
					</h1>
					<div className="mt-7 flex items-center gap-3">
						<div className="overflow-hidden rounded-full">
							<Image
								src="/images/lydia-hallie-avatar.png"
								alt="Lydia Hallie"
								width={40}
								height={40}
							/>
						</div>
						<div className="text-sm font-medium uppercase tracking-widest">
							by Lydia Hallie
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Hero
