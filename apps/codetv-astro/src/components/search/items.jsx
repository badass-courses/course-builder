/** @jsxImportSource react */
import { Highlight } from './highlight'
import { ReturnIcon } from './icons/return-icon'
import { Snippet } from './snippet'

/**
 * Link item (Google Calendar, Twitch, etc.) for the empty query page
 */
export function LinkItem({ item }) {
	const Icon = item.icon

	return (
		<a
			className="aa-Link"
			href={item.url}
			rel="noopener noreferrer"
			target="_blank"
		>
			<div className="aa-LinkItem">
				<div className="aa-LinkItem-Content">
					<div className="aa-Icon">
						<Icon />
					</div>
					<div>
						<div className="aa-LinkLabel">{item.label}</div>
						<div className="aa-LinkDescription">{item.description}</div>
					</div>
				</div>
				<ReturnIcon className="aa-LinkIcon" />
			</div>
		</a>
	)
}

/**
 * Episode item (latest episodes, upcoming episodes) for the empty query page
 */
export function EmptyQueryEpisodeItem({ item }) {
	const participants = [item.guest, item.host]
		.reduce((acc, curr) => {
			if (acc.find((participant) => participant?.name === curr?.name)) {
				return acc
			}

			return [...acc, curr]
		}, [])
		.slice(0, 2)
		.filter(Boolean)

	return (
		<a
			className="aa-Link"
			href={`/${item.slug.current}`}
			rel="noopener noreferrer"
		>
			<div className="aa-LinkItem">
				<div className="aa-LinkItem-Content">
					<div className="aa-Participants">
						{participants.map((participant, index) => (
							<div
								key={participant?.name}
								className={`aa-Participant ${
									index === 0 ? 'aa-Participant--first' : ''
								}`}
								style={{ zIndex: participants.length - index }}
							>
								<svg fill="none" viewBox="0 0 84 84">
									<title>{participant.name}</title>
									<defs>
										<circle id="photo-area" cx="42" cy="42" r="38"></circle>
									</defs>
									<clipPath id="photo">
										<use href="#photo-area" fill="black" />
									</clipPath>
									<path
										className="border"
										fill="url(#lwj-gradient)"
										fillRule="evenodd"
										d="M42 0 C19 0, 0 19, 0 42 C0 65, 18 84, 42 84 C65 84, 84 65, 84 42 C84 19, 65 0, 42 0 M42 2 C20 2, 2 20, 2 42 C2 64, 20 82, 42 82 C64 82, 82 64, 82 42 C82 20, 64 2, 42 2"
										clipRule="evenodd"
									></path>
									<use href="#photo-area" stroke="white" strokeWidth="4" />
									<image
										clipPath="url(#photo)"
										href={participant.image}
										width="100%"
									></image>
								</svg>
							</div>
						))}
					</div>
					<div className="aa-LinkText">
						<div className="aa-LinkLabel">{item.title}</div>
						<div className="aa-LinkDescription">With {item.guest.name}</div>
					</div>
					<ReturnIcon className="aa-LinkIcon" />
				</div>
			</div>
		</a>
	)
}

/**
 * Episode item for search results
 */
export function QueryEpisodeItem({ item }) {
	const descriptionAttribute =
		item._snippetResult?.description?.matchLevel === 'none'
			? 'content'
			: 'description'

	return (
		<a className="aa-Link" href={item.url} rel="noopener noreferrer">
			<div className="aa-LinkItem">
				<div className="aa-LinkItem-Content">
					<img className="aa-CoverImage" src={item.image} />
					<div>
						<div className="aa-LinkLabel">
							<Highlight hit={item} attribute="headline" />
						</div>
						<div className="aa-LinkDescription">
							<Snippet hit={item} attribute={descriptionAttribute} />
						</div>
					</div>
				</div>
				<ReturnIcon className="aa-LinkIcon" />
			</div>
		</a>
	)
}

/**
 * Button item for the "see all" buttons on the empty query page
 */
export function ButtonItem({ item }) {
	return (
		<a className="button" href={item.url}>
			{item.label}
		</a>
	)
}
