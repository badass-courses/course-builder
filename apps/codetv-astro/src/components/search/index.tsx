import { useState } from 'react'
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia'

import { Autocomplete } from './autocomplete.jsx'
import { NewsletterIcon } from './icons/newsletter-icon.jsx'
import { SearchIcon } from './icons/search-icon.tsx'
import { LinkItem, QueryEpisodeItem } from './items.jsx'
import { GoogleCalendarLogo } from './logos/google-calendar-logo.jsx'
import { YouTubeLogo } from './logos/youtube-logo.jsx'
import { searchClient } from './search-client'

type AlgoliaItem = {
	item: {
		url: string
		slug: {
			current: string
		}
	}
}

export function SearchBox({
	open,
	onToggle = () => window.location.assign('/'),
}: {
	open: boolean
	onToggle?: () => void
}) {
	return (
		<Autocomplete
			placeholder="Search for episodes and posts"
			openOnFocus={true}
			autoFocus={true}
			defaultActiveItemId={0}
			isOpen={open}
			onToggle={onToggle}
			initialState={{
				query: new URL(window.location.toString()).searchParams.get('q') ?? '',
			}}
			emptyQuery={() => [
				{
					sourceId: 'links',
					getItems: () => [
						{
							label: 'Subscribe to the newsletter',
							description: 'The best way to make sure you don’t miss anything.',
							url: '/newsletter',
							icon: () => (
								<div className="aa-LinkPicture">
									<NewsletterIcon />
								</div>
							),
						},
						{
							label: 'Add schedule to Google Calendar',
							description: 'See upcoming shows and events in your calendar.',
							url: '/calendar',
							icon: () => (
								<div className="aa-LinkPicture">
									<GoogleCalendarLogo />
								</div>
							),
						},
						{
							label: 'Subscribe on YouTube',
							description: 'Watch all past LWJ episodes.',
							url: 'https://www.youtube.com/channel/UCnty0z0pNRDgnuoirYXnC5A',
							icon: () => (
								<div className="aa-LinkPicture aa-LinkPicture--YouTube">
									<YouTubeLogo />
								</div>
							),
						},
					],
					getItemUrl: ({ item }: AlgoliaItem) => item.url,
					templates: {
						header: () => <div className="aa-Header">Links</div>,
						item: ({ item }: AlgoliaItem) => <LinkItem item={item} />,
					},
				},
			]}
			sources={() => [
				{
					sourceId: 'episodes',
					getItemUrl({ item }: AlgoliaItem) {
						return item.url
					},
					getItems({ query, ...rest }: { query: any }) {
						console.log(rest)
						return getAlgoliaResults({
							searchClient,
							queries: [
								{
									indexName: 'codetv_dev_yzf8n5ikfx_episodes',
									query,
									params: {
										hitsPerPage: 12,
									},
								},
								{
									indexName: 'codetv_dev_yzf8n5ikfx_articles',
									query,
									params: {
										hitsPerPage: 12,
									},
								},
								{
									indexName: 'codetv_dev_yzf8n5ikfx_pages',
									query,
									params: {
										hitsPerPage: 12,
									},
								},
							],
						})
					},
					templates: {
						item: ({ item }: AlgoliaItem) => <QueryEpisodeItem item={item} />,
					},
				},
			]}
			noResults={({ query }: { query: any }) => (
				<div className="aa-NoResults">
					<div className="aa-NoResultsLabel">No results for "{query}".</div>
					<div className="aa-NoResultsDescription">
						Here's a consolation Corgi.
					</div>
					<img
						className="aa-NoResultsImage"
						src="https://cdn.shopify.com/s/files/1/0589/5798/8049/products/corgi-pal.png?v=1627084571"
						alt="a cartoon corgi with rainbow colors"
					/>
				</div>
			)}
		/>
	)
}

export function Search() {
	const [searchState, setSearchState] = useState<'open' | 'closed'>('closed')

	return (
		<>
			<button
				className="aa-OpenButton"
				data-name="main-search"
				onClick={() => setSearchState('open')}
			>
				<SearchIcon />
				<span className="aa-OpenButtonText" data-viewport="large">
					search the site
				</span>
				<span className="aa-OpenButtonText" data-viewport="small">
					search
				</span>
				<span className="sr-only">Open search</span>
			</button>
			<SearchBox
				open={searchState === 'open'}
				onToggle={() =>
					setSearchState(searchState === 'open' ? 'closed' : 'open')
				}
			/>
		</>
	)
}
