'use client'

import * as React from 'react'
import type { Engine } from '@tsparticles/engine'
import { loadStarsPreset } from '@tsparticles/preset-stars'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

export const ParticlesHeroEffect = () => {
	const [init, setInit] = React.useState(false)
	React.useEffect(() => {
		initParticlesEngine(async (engine: Engine) => {
			await loadSlim(engine)
			await loadStarsPreset(engine as any)
		}).then(() => {
			const timeout = setTimeout(() => {
				setInit(true)
			}, 750)
			return () => {
				clearTimeout(timeout)
			}
		})
	}, [])

	const particlesLoaded = (container: any) => {
		return container
	}

	return init ? (
		<>
			<Particles
				id="redParticles"
				particlesLoaded={particlesLoaded}
				className="absolute top-0 z-10 h-full w-full"
				options={{
					name: 'red',
					fullScreen: {
						enable: false,
					},
					preset: 'stars',
					retina_detect: true,
					background: {
						opacity: 0,
					},
					pauseOnOutsideViewport: true,
					zLayers: 1,
					particles: {
						shadow: {
							blur: 20,
							color: '#F85C1F',
							enable: true,
						},
						number: {
							value: 50,
						},
						size: {
							value: { min: 1, max: 5 },
						},
						opacity: {
							value: {
								min: 0.1,
								max: 0.5,
							},
							animation: {
								enable: true,
								speed: 0.2,
							},
						},
						color: {
							value: '#F85C1F',
						},
						move: {
							direction: 'outside',
							center: {
								x: 50,
								y: 5,
							},
							enable: true,
							speed: {
								max: 0.6,
								min: 0.1,
							},
							straight: false,
							random: true,
						},
					},
				}}
			/>
			<Particles
				id="blueParticles"
				particlesLoaded={particlesLoaded}
				className="absolute left-0 top-0 z-0 h-full w-full"
				options={{
					name: 'blue',
					fullScreen: {
						enable: false,
					},
					preset: 'stars',
					detectRetina: true,
					background: {
						opacity: 0,
					},
					pauseOnOutsideViewport: true,
					zLayers: 10,
					particles: {
						number: {
							value: 300,
						},
						zIndex: {
							value: {
								min: 1,
								max: 5,
							},
						},
						shadow: {
							blur: 20,
							color: '#67CBEB',
							enable: true,
						},
						size: {
							value: { min: 1, max: 3.2 },
						},
						color: {
							value: '#67CBEB',
						},
						opacity: {
							value: {
								min: 0.1,
								max: 0.95,
							},
						},
						move: {
							direction: 'outside',
							center: {
								x: 50,
								y: 200,
							},
							enable: true,
							speed: {
								max: 0.7,
								min: 0.2,
							},
							straight: true,
						},
					},
				}}
			/>
		</>
	) : null
}
