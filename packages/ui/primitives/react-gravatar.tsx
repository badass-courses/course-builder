import { type CSSProperties } from 'react'
import md5 from 'md5'
import querystring from 'query-string'

function isRetina() {
	var mediaQuery
	if (typeof window !== 'undefined' && window !== null) {
		mediaQuery =
			'(-webkit-min-device-pixel-ratio: 1.25), (min--moz-device-pixel-ratio: 1.25), (-o-min-device-pixel-ratio: 5/4), (min-resolution: 1.25dppx)'
		if (window.devicePixelRatio > 1.25) {
			return true
		}
		if (window.matchMedia && window.matchMedia(mediaQuery).matches) {
			return true
		}
	}
	return false
}

interface GravatarProps {
	email?: string
	md5?: string
	size?: number
	rating?: 'g' | 'pg' | 'r' | 'x'
	default?: string
	className?: string
	protocol?: string
	domain?: string
	style?: CSSProperties
}

const DEFAULT_PROPS = {
	size: 50,
	rating: 'g',
	default: 'retro',
	protocol: '//',
	domain: 'www.gravatar.com',
} as const

export function Gravatar({
	email,
	md5: md5Hash,
	size = DEFAULT_PROPS.size,
	rating = DEFAULT_PROPS.rating,
	default: defaultImage = DEFAULT_PROPS.default,
	protocol = DEFAULT_PROPS.protocol,
	domain = DEFAULT_PROPS.domain,
	style,
	className: customClassName,
	...rest
}: GravatarProps) {
	const base = `${protocol}${domain}/avatar/`

	const query = querystring.stringify({
		s: size,
		r: rating,
		d: defaultImage,
	})

	const retinaQuery = querystring.stringify({
		s: size * 2,
		r: rating,
		d: defaultImage,
	})

	// Gravatar service currently trims and lowercases all registered emails
	const formattedEmail = (email ?? '').trim().toLowerCase()

	let hash: string
	if (md5Hash) {
		hash = md5Hash
	} else if (typeof email === 'string') {
		hash = md5(formattedEmail, { encoding: 'binary' })
	} else {
		console.warn(
			'Gravatar image can not be fetched. Either the "email" or "md5" prop must be specified.',
		)
		return null
	}

	const src = `${base}${hash}?${query}`
	const retinaSrc = `${base}${hash}?${retinaQuery}`

	const modernBrowser =
		typeof window === 'undefined'
			? true // server-side, we render for modern browsers
			: 'srcset' in document.createElement('img')

	const className = customClassName
		? `react-gravatar ${customClassName}`
		: 'react-gravatar'

	if (!modernBrowser && isRetina()) {
		return (
			<img
				alt={email ? `Gravatar for ${formattedEmail}` : 'Gravatar'}
				style={style}
				src={retinaSrc}
				height={size}
				width={size}
				className={className}
				{...rest}
			/>
		)
	}

	return (
		<img
			alt={`Gravatar for ${formattedEmail}`}
			style={style}
			src={src}
			srcSet={`${retinaSrc} 2x`}
			height={size}
			width={size}
			className={className}
			{...rest}
		/>
	)
}

Gravatar.displayName = 'Gravatar'

export default Gravatar
