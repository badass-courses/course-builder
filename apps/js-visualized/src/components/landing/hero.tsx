import * as React from 'react'
import Image from 'next/image'

const Hero = () => {
	return (
		<div className="relative">
			<Image
				src="/images/bg-landing-hero.png"
				alt="hero section"
				width={1360}
				height={760}
				priority
			/>
		</div>
	)
}

export default Hero
