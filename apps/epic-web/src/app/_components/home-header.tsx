import Image from 'next/image'
import Balancer from 'react-wrap-balancer'

import { ParticlesHeroEffect } from './particle-hero-effect'

export const HomeHeader = () => {
	return (
		<header className="relative flex min-h-[108vh] flex-col items-center justify-start overflow-hidden bg-black">
			<div className="absolute top-[120px] z-40 mx-auto text-center sm:top-[14vh] xl:top-[16vh]">
				<h1 className="fluid-2xl sm:fluid-3xl max-w-3xl px-5 font-bold text-white shadow-black drop-shadow-lg sm:leading-tight lg:px-16">
					<span className="inline-flex pb-4 font-sans text-sm font-semibold uppercase tracking-wider text-orange-300 shadow-black drop-shadow-md">
						Everything You Need to Know to
					</span>
					<div className="shadow-black drop-shadow-lg">
						<Balancer>Ship Modern Full-Stack Web Applications</Balancer>
					</div>
				</h1>
			</div>
			<div
				className="absolute left-0 top-0 z-20 h-full w-full"
				style={{
					backgroundImage:
						'radial-gradient(transparent, transparent, black, black)',
				}}
			/>
			<Image
				src={require('../../../public/assets/hero/hero-front-compressed.png')}
				fill
				className="z-20 mx-auto object-cover object-bottom 2xl:object-fill"
				alt=""
				quality={100}
				aria-hidden
				priority
				placeholder="empty"
			/>
			<div className="flex h-full w-full items-start justify-center">
				<Image
					className="absolute z-20 flex w-[500px] -translate-y-10 items-start justify-center sm:w-[600px] sm:-translate-y-24"
					src={require('../../../public/assets/hero/small-planet-compressed.png')}
					width={800}
					alt=""
					quality={100}
					aria-hidden
					priority
				/>
			</div>
			<div className="absolute bottom-[25%] z-20 mx-auto w-[130px] sm:w-[180px] lg:w-[200px]">
				<Image
					src={require('../../../public/assets/hero/ships-compressed.png')}
					width={250}
					alt=""
					quality={100}
					aria-hidden
					priority
					placeholder="blur"
				/>
			</div>
			<div className="dark:to-background absolute bottom-0 left-0 z-30 h-32 w-full bg-gradient-to-b from-transparent" />
			<ParticlesHeroEffect />
		</header>
	)
}
