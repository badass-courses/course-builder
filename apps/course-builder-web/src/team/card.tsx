import React from 'react'
import { UserGroupIcon } from '@heroicons/react/solid'

const Card: React.FC<
	React.PropsWithChildren<{
		icon: React.ReactElement
		title: {
			as: React.ElementType
			content: string
		}
	}>
> = ({
	children,
	icon = <UserGroupIcon className="w-5 text-green-500" aria-hidden="true" />,
	title = { as: 'h1', content: `Invite your team` },
}) => {
	const Title = (props: any) =>
		React.createElement(title.as, props, `${title.content}`)
	return (
		<div data-team-card="">
			<div data-title="">
				{icon} <Title />
			</div>
			<div data-content="">{children}</div>
		</div>
	)
}

export default Card
