'use client'

import Image from 'next/image'
import config from '@/config'

import { cn } from '@coursebuilder/ui/utils/cn'

import MDX from './copy.mdx'
import WorkshopMDX from './workshop-copy.mdx'

const LandingCopy = () => {
	return <MDX />
}
export const WorkshopCopy = () => (
	<WorkshopMDX
		components={{
			Instructor,
		}}
	/>
)

export default LandingCopy

export const Instructor = ({ className }: { className?: string }) => {
	return (
		<section
			className={cn('relative flex w-full flex-col items-center', className)}
		>
			<div className="mx-auto flex w-full max-w-screen-lg flex-col items-center sm:gap-10 md:flex-row">
				<div className="not-prose w-auto sm:mx-auto">
					<Image
						src={require('../../../public/assets/jack-herrington.jpg')}
						alt={config.author}
						width={1200 / 2.6}
						height={853 / 2.6}
						quality={100}
						className="rounded"
					/>
				</div>
				<div className="max-w-lg md:px-5">
					<h3>Your Instructor</h3>
					<div
					// className="flex flex-col gap-4 text-lg leading-relaxed"
					>
						<p>
							Jack Herrington is a Full Stack Principal Engineer who
							orchestrated the rollout of React/NextJS at Walmart Labs and Nike.
							He is also the "Blue Collar Coder" on YouTube where he posts
							weekly videos on advanced use of React and NextJS as well as other
							frontend technologies trends.{' '}
						</p>
						<p>
							His{' '}
							<a
								href="https://www.youtube.com/@jherr"
								target="_blank"
								rel="noreferrer noopener"
								className="text-primary"
							>
								YouTube channel
							</a>{' '}
							hosts an entire free courses on React and TypeScript. He has
							written seven books including most recently No-BS TypeScript which
							is a companion book to the YouTube course.
						</p>
					</div>
				</div>
			</div>
		</section>
	)
}
