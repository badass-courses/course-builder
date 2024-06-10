import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'

import KentImage from '../../public/kent-c-dodds.png'

const ContributorBio: React.FC<{
	bio?: string | React.ReactNode
	picture?: { url: string; alt: string } | null
	name?: string
	slug?: string
	title?: (name?: string) => string
	className?: string
}> = ({
	title = (name) => `About ${name}`,
	bio = (
		<>
			Kent C. Dodds is a world renowned speaker, teacher, and trainer and
			he&#39;s actively involved in the{' '}
			<a
				href="https://github.com/kentcdodds"
				rel="noopener noreferrer"
				className="dark:text-brand text-indigo-500 text-opacity-100 hover:underline"
				target="_blank"
			>
				open source community
			</a>{' '}
			as a maintainer and contributor of hundreds of popular npm packages. He is
			the creator of{' '}
			<a
				href="https://epicreact.dev"
				target="_blank"
				className="dark:text-brand text-indigo-500 text-opacity-100 hover:underline"
				rel="noreferrer"
			>
				EpicReact.Dev
			</a>{' '}
			and{' '}
			<a
				href="https://testingjavascript.com"
				target="_blank"
				className="dark:text-brand text-indigo-500 text-opacity-100 hover:underline"
				rel="noreferrer"
			>
				TestingJavaScript.com
			</a>
			. He&#39;s an instructor on{' '}
			<a
				href="https://egghead.io/q/resources-by-kent-c-dodds"
				target="_blank"
				rel="noreferrer"
				className="dark:text-brand text-indigo-500 text-opacity-100 hover:underline"
			>
				egghead.io
			</a>{' '}
			and{' '}
			<a
				href="https://frontendmasters.com"
				rel="noopener noreferrer"
				target="_blank"
				className="dark:text-brand text-indigo-500 text-opacity-100 hover:underline"
			>
				Frontend Masters
			</a>
			. He&#39;s also a Google Developer Expert. Kent is happily married and the
			father of four kids. He likes his family, code, JavaScript, and Remix.
		</>
	),
	name = 'Kent C. Dodds',
	picture = { url: KentImage, alt: 'Kent C. Dodds' },
	className,
	slug = 'kent-c-dodds',
}) => {
	return (
		<section
			className={twMerge(
				'mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-10 px-5 py-20 sm:gap-16 sm:py-32 md:flex-row',
				className,
			)}
		>
			<div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
				{picture?.url && (
					<Link href={`/contributors/${slug}`}>
						<Image
							src={picture.url}
							width={200}
							height={200}
							alt={picture.alt}
							className="aspect-square"
						/>
					</Link>
				)}
			</div>

			<div className="text-center md:text-left">
				<Link
					href={`/contributors/${slug}`}
					className="inline-block pb-3 text-xl font-semibold hover:underline"
				>
					{title(name)}
				</Link>
				<p className="text-lg text-gray-800 text-opacity-80 dark:text-gray-300">
					{bio}
				</p>
			</div>
		</section>
	)
}

export default ContributorBio
