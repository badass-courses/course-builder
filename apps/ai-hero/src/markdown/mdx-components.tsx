import Image, { ImageProps } from 'next/image'
import MuxPlayer from '@mux/mux-player-react'
import ReactMarkdown from 'react-markdown'

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
					<svg
						width={20}
						height={20}
						viewBox={'0 0 16 16'}
						role="img"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>{'X (formerly twitter)'}</title>
						<g>
							<path
								d="M7.22852 10.101L2.93802 15H0.561523L6.11852 8.652L7.22852 10.101Z"
								fill="currentColor"
							/>
							<path
								d="M8.52539 5.494L12.4539 1H14.8289L9.62539 6.951L8.52539 5.494Z"
								fill="currentColor"
							/>
							<path
								d="M15.7439 15H10.9644L0.255859 1H5.15636L15.7439 15ZM11.6199 13.5785H12.9359L4.44136 2.347H3.02936L11.6199 13.5785Z"
								fill="currentColor"
							/>
						</g>
					</svg>
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
