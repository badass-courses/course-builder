import Image, { ImageProps } from 'next/image'
import MuxPlayer from '@mux/mux-player-react'
import ReactMarkdown from 'react-markdown'

import { Icon } from './icons'

type TweetProps = {
	text: string
	url: string
	author: {
		name: string
		handle: string
		avatar: string
	}
}

const Tweet: React.FC<TweetProps> = ({ text, url, author }) => {
	const { avatar, name, handle } = author
	return (
		<blockquote data-body-tweet="">
			<div data-header="">
				<a
					href={`https://twitter.com/${handle}`}
					target="_blank"
					rel="noopener noreferrer"
					data-author=""
				>
					<Image src={avatar} alt={name} width={48} height={48} />
					<div data-name="">
						{name} <div data-handle="">@{handle}</div>
					</div>
				</a>
				<a href={url} target="_blank" rel="noopener noreferrer">
					<Icon name="Twitter" size="20" />
				</a>
			</div>
			<div data-body="">
				<ReactMarkdown>{text}</ReactMarkdown>
			</div>
		</blockquote>
	)
}

type VideoProps = {
	url: string
	title?: string
	poster?: string
}

const Video: React.FC<VideoProps> = ({ url, title, poster }) => {
	return (
		<figure data-body-video="" className="video">
			<video
				autoPlay={false}
				loop={true}
				controls={true}
				className="rounded-md"
				poster={poster}
			>
				<source src={url} type="video/mp4" />
			</video>
			{title && (
				<div className="pb-4 pt-2 text-base font-medium text-slate-400">
					{title}
				</div>
			)}
		</figure>
	)
}

type YouTubeProps = {
	videoId: string
}

const YouTube: React.FC<YouTubeProps> = ({ videoId }) => {
	return (
		<iframe
			data-body-video=""
			src={`https://www.youtube.com/embed/${videoId}`}
			title="YouTube video player"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			frameBorder={0}
			allowFullScreen
		></iframe>
	)
}

type MuxVideoProps = {
	playbackId: string
}

const MuxVideo: React.FC<MuxVideoProps> = ({ playbackId }) => {
	return playbackId ? (
		<MuxPlayer data-body-video="" playbackId={playbackId} />
	) : null
}

type TestimonialProps = {
	author: {
		name: string
		image: string
	}
}

const Testimonial: React.FC<React.PropsWithChildren<TestimonialProps>> = ({
	children,
	author,
}) => {
	return (
		<div data-body-testimonial="">
			<div data-content="">
				<blockquote>{children}</blockquote>
				{author?.name && (
					<div data-author="">
						{author.image ? (
							<div data-image="">
								<Image
									src={author.image}
									alt={author.name}
									width={40}
									height={40}
								/>
							</div>
						) : (
							'— '
						)}
						<span data-name="">{author.name}</span>
					</div>
				)}
			</div>
			<div data-border="" aria-hidden="true" />
			<div data-quote="" aria-hidden="true">
				”
			</div>
		</div>
	)
}

const mdxComponents = {
	Tweet: ({ text, url, author }: TweetProps) => {
		return <Tweet text={text} url={url} author={author} />
	},
	Video: ({ url, title, poster }: VideoProps) => {
		return <Video url={url} title={title} poster={poster} />
	},
	Testimonial: ({
		children,
		author,
	}: React.PropsWithChildren<TestimonialProps>) => {
		return <Testimonial author={author}>{children}</Testimonial>
	},
	MuxVideo: ({ playbackId }: MuxVideoProps) => {
		return <MuxVideo playbackId={playbackId} />
	},
	YouTube: ({ videoId }: YouTubeProps) => {
		return <YouTube videoId={videoId} />
	},
	Image: (props: ImageProps) => <Image {...props} />,
	ChecklistItem: ({ children }: React.PropsWithChildren<{}>) => {
		return <li data-checklist-item="">{children}</li>
	},
}

export default mdxComponents
