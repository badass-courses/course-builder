import type { NavLinkItem } from '../navigation/nav-link-item'

export function getNavLinks() {
	return [
		{
			href: '/tips',
			label: 'Tips',
		},
		{
			href: '/tutorials',
			label: 'Tutorials',
		},
		// {
		// 	href: '/events',
		// 	label: 'Events',
		// },
		// {
		// 	href: '/articles',
		// 	label: 'Articles',
		// },
	] as NavLinkItem[]
}
